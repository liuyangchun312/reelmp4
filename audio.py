# Procedural 120 BPM score, synced to visual events. -> audio.wav (48k stereo)
import json, numpy as np, wave
from scipy.signal import fftconvolve, butter, sosfilt
SR, DUR = 48000, 60.0
N = int(SR * DUR)
L = np.zeros(N); R = np.zeros(N)
rs = np.random.default_rng(7)
D = json.load(open('data.json'))
B = 0.5  # beat

def tt(d): return np.arange(int(d * SR)) / SR
def put(sig, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR)
    if i >= N or i + len(sig) <= 0: return
    s = sig[:N - i] * gain
    L[i:i + len(s)] += s * np.sqrt((1 - pan) / 2) * 1.414
    R[i:i + len(s)] += s * np.sqrt((1 + pan) / 2) * 1.414
def env(n, a=0.002, d=0.3):
    t = np.arange(n) / SR
    return np.minimum(t / a, 1) * np.exp(-t / d)
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, lo, hi): return sosfilt(butter(2, [lo, hi], 'band', fs=SR, output='sos'), x)
def mtof(m): return 440 * 2 ** ((m - 69) / 12)

# ---------- instruments ----------
def kick(g=1.0):
    t = tt(0.5); f = 48 + 110 * np.exp(-t * 30)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7) * g
def hat(d=0.04):
    n = hp(rs.standard_normal(int(0.12 * SR)), 7000); return n * env(len(n), 0.0005, d) * 0.35
def snare():
    t = tt(0.3); n = bp(rs.standard_normal(len(t)), 1500, 7000) * np.exp(-t * 16)
    return n * 0.6 + np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25) * 0.4
def impact(d=2.5):
    t = tt(d); f = 35 + 60 * np.exp(-t * 6)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    crack = lp(rs.standard_normal(len(t)), 3500) * np.exp(-t * 5)
    return boom * 1.0 + crack * 0.45
def riser(d, f0=200, f1=4000):
    t = tt(d); n = rs.standard_normal(len(t)); out = np.zeros_like(n); k = 24
    for j in range(k):  # sweep a bandpass in steps
        a, b = j * len(t) // k, (j + 1) * len(t) // k
        fc = f0 * (f1 / f0) ** (j / k)
        out[a:b] = bp(n, fc * .7, min(fc * 1.4, 20000))[a:b]
    return out * (t / d) ** 2.2 * 0.5
def whoosh(d=0.6, fc=1200):
    t = tt(d); n = bp(rs.standard_normal(len(t)), fc * .5, fc * 2)
    return n * np.sin(np.pi * t / d) ** 2 * 0.5
def pluck(m, d=1.2, g=0.3):  # Karplus-Strong, guzheng-ish
    f = mtof(m); p = int(SR / f); buf = rs.uniform(-1, 1, p); n = int(d * SR); out = np.zeros(n)
    for i in range(n):
        out[i] = buf[i % p]; buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return out * g * env(n, 0.001, d * .6)
def bell(m, d=1.6, g=0.18):
    t = tt(d); f = mtof(m)
    s = np.sin(2 * np.pi * f * t + 2.2 * np.exp(-t * 3) * np.sin(2 * np.pi * f * 3.5 * t))
    return s * env(len(t), 0.002, d * .35) * g
def pad(ms, d, g=0.08):
    t = tt(d); s = np.zeros_like(t)
    for m in ms:
        for det in (-0.08, 0.0, 0.07):
            s += np.sign(np.sin(2 * np.pi * mtof(m + det) * t)) * 0.3 + np.sin(2 * np.pi * mtof(m + det) * t)
    s = lp(s, 1400) / (len(ms) * 3)
    a = np.minimum(t / 0.8, 1) * np.minimum((d - t) / 0.8, 1)
    return s * a * g
def bass(m, d, g=0.35):
    t = tt(d); s = np.sin(2 * np.pi * mtof(m) * t) + 0.3 * np.sin(4 * np.pi * mtof(m) * t)
    return lp(s, 400) * env(len(t), 0.004, d * .7) * g
def brush(d, g=0.25):  # calligraphy stroke: soft filtered noise swell
    t = tt(d + 0.15); n = bp(rs.standard_normal(len(t)), 600, 3200)
    e = np.sin(np.pi * np.clip(t / (d + 0.15), 0, 1)) ** 1.5
    return n * e * g
def click(g=0.4):
    t = tt(0.03); return np.sin(2 * np.pi * 2400 * t) * np.exp(-t * 300) * g
# ---------- score (D minor pentatonic: D F G A C) ----------
PENT = [50, 53, 55, 57, 60, 62, 65, 67, 69, 72, 74, 77, 79, 81, 84]
_pk = {}
def pk(m, d=1.2, g=0.3):
    if (m, d) not in _pk: _pk[(m, d)] = pluck(m, d, 1.0)
    return _pk[(m, d)] * g
dry = []  # (sig, t, gain, pan, send) collected then summed into dry + reverb bus
def ev(sig, t0, g=1.0, pan=0.0, send=0.3): dry.append((sig, t0, g, pan, send))

# 0-6 ORIGIN
ev(pad([38, 45], 6.2, 0.10), 0.0, send=0.5)
ev(click(.5), 0.5); ev(bell(74, 2.0, .2), 0.5, send=.6)
ev(whoosh(1.0, 900), 0.95, .5)
for i, a in enumerate([2.0, 2.5, 3.0, 3.5]): ev(kick(.6), a); ev(pk(PENT[5 + i * 2], 1.0), a, .25, (i - 1.5) * .3)
for a, m, p in [(4.0, 62, -.5), (4.5, 65, 0), (4.75, 69, .5)]: ev(pk(m, 1.5), a, .35, p, .5); ev(hat(.08), a, .6)
ev(whoosh(.5, 2000), 5.1, .6); ev(riser(1.0, 300, 6000), 5.0, .7); ev(impact(2.5), 6.0, .9, send=.4)
# 6-13 NAME: groove
for k in range(14):
    b = 6.0 + k * B
    if b >= 11.9: break
    ev(kick(.85), b, send=.05)
    ev(hat(), b + .25, .7, .3, .05)
    if k % 2: ev(snare(), b, .45, send=.2)
for a in (6.5, 7.0, 7.5): ev(impact(.6), a, .55); ev(whoosh(.35, 3000), a - .3, .4)
for k, m in enumerate([38, 38, 41, 43, 45, 45, 43, 41]): ev(bass(m, .9), 6.0 + k * .75, send=0)
for a in (8.5, 11.0): ev(hp(rs.standard_normal(int(.25 * SR)), 2000) * env(int(.25 * SR), .001, .08) * .4, a)
for i in range(5): ev(whoosh(.5, 1500 + i * 400), 10.0 + i * .06, .35, (i - 2) * .4)
ev(pad([50, 57, 60], 2.0, .08), 10.5, send=.6)
t = tt(.5); ev(np.sin(2 * np.pi * np.cumsum(1400 * np.exp(-t * 4)) / SR) * env(len(t), .01, .3) * .12, 11.9, send=.6)
ev(impact(1.5), 12.4, .6, send=.7); ev(bell(81, 2.0, .15), 12.45, send=.8)
# 13-21 STROKE: brush per stroke + pentatonic note on stroke start
ev(pad([50, 57, 62, 65], 8.0, .07), 13.0, send=.6)
for i, s in enumerate(D['strokes']):
    ev(brush(s['dur'], .22), s['t'], 1.0, (hash_ := ((i * 37) % 11) / 10 - .5) * .6, .35)
    ev(pk(PENT[(i * 3) % 10 + 2], 1.4), s['t'], .16, hash_, .6)
ev(impact(1.2), 20.1, .5, send=.3); ev(click(.6), 20.1)
ev(riser(.9, 400, 8000), 20.5, .8)
# 21-29 BLADE
ev(impact(3.0), 21.5, 1.0, send=.5)
t = tt(2.5); shing = sum(np.sin(2 * np.pi * f * t) for f in (2637, 3951, 5274)) * np.exp(-t * 2.5) * .05
ev(shing, 21.5, 1, .2, .8)
for k in range(12):
    b = 22.5 + k * B
    if b < 25.5: ev(kick(.8), b, send=.05); ev(click(.35), b); ev(snare(), b + .25, .25)
for k, m in enumerate([38, 41, 36, 43, 38, 45]): ev(bass(m, .5), 22.5 + k * .5, send=0)
for k in range(4):
    for j in range(6): ev(hat(.03), 25.5 + k * .5 + j * .03, .5, (j - 2.5) * .3)
    ev(whoosh(.4, 2500), 25.5 + k * .5, .3, (k - 1.5) * .5)
ev(pad([45, 52, 57], 3.0, .07), 25.5, send=.7)
ev(riser(.6, 600, 9000), 27.4, .7); ev(impact(1.0), 28.0, .45, send=.6)
ev(whoosh(.7, 800), 28.25, .5); ev(click(.4), 29.3)
# 29.3-37.5 POPLAR / SPRING bloom
ev(pad([50, 57, 62], 4.4, .09), 29.3, send=.7)
ev(pad([53, 60, 65, 69], 4.4, .09), 33.3, send=.7)
for k in range(16):  # slow arpeggio of growth
    ev(pk(PENT[[0, 2, 4, 3, 1, 3, 5, 4][k % 8] + (k // 8) * 2], 1.6), 29.5 + k * .25, .14, ((k % 4) - 1.5) * .4, .6)
for k, m in enumerate([38, 38, 41, 41, 43, 43, 45, 45]): ev(bass(m, 1.0, .25), 29.3 + k, send=0)
slots = sorted(set(D['blossoms']))
for i, s in enumerate(slots):
    n = D['blossoms'].count(s)
    ev(bell(PENT[min(4 + i // 2, 14)] + 12 * (i % 5 == 4), 1.4, .07 + .01 * min(n, 6)), s, 1.0, ((i * 7) % 9) / 8 - .5, .7)
for k in range(8): ev(kick(.35), 33.5 + k * .5, send=.05); ev(hat(.03), 33.75 + k * .5, .4)
ev(whoosh(2.2, 700), 36.3, .7, .4, .5)
# 37.5-45 SPRING swarm -> 春 -> burst
ev(pad([50, 57, 62, 69], 4.5, .1), 37.5, send=.8)
ev(riser(2.8, 200, 7000), 39.2, .8)
for k in range(12): ev(bell(PENT[k % 15] + 12, .8, .05), 40.6 + k * .1, 1, ((k % 5) - 2) * .3, .9)
ev(impact(3.0), 42.0, 1.1, send=.6); ev(shing * 1.2, 42.0, 1, -.2, .8)
ev(pad([38, 45, 50], 3.0, .08), 42.4, send=.7)
ev(riser(1.4, 500, 6000), 43.6, .5)
# 45-53 PRACTICE: full groove, a stab on every card
for k in range(16):
    b = 45 + k * B
    ev(kick(1.0), b, send=.03); ev(hat(), b + .25, .8, .35, .03); ev(hat(.02), b + .125, .3, -.35, .03)
    if k % 2: ev(snare(), b, .55, send=.25)
BL = [38, 38, 41, 43, 45, 43, 41, 36]
for k in range(8):
    ev(bass(BL[k], .45), 45 + k, send=0); ev(bass(BL[k], .4), 45.5 + k, .8, send=0)
    ev(pk(PENT[5 + (k * 2) % 7], .9), 45 + k, .3, 0, .4); ev(pk(PENT[8 + (k * 3) % 6], .9), 45.02 + k, .2, .3, .4)
    ev(whoosh(.2, 3000), 44.88 + k, .4)
ev(riser(1.0, 400, 9000), 52.0, .8)
# 53-60 SIGNATURE
ev(impact(3.5), 53.0, .9, send=.7)
ev(pad([50, 57, 62, 65, 69], 6.5, .11), 53.0, send=.8)
for i, a in enumerate((53.5, 53.75, 54.0)): ev(pk([62, 65, 69][i], 2.0), a, .4, (i - 1) * .4, .7)
ev(whoosh(.7, 1800), 54.5, .4); ev(bell(74, 3, .16), 55.0, send=.8)
ev(impact(2.0), 56.5, .8, send=.5); ev(click(.6), 56.5)
ev(bell(86, 3.5, .12), 57.5, send=.9)
ev(click(.5), 59.4); ev(bell(74, 2.5, .1), 59.4, send=.95)

# ---------- mix ----------
DL, DR, WL, WR = (np.zeros(N) for _ in range(4))
for sig, t0, g, pan, send in dry:
    i = int(t0 * SR)
    if i >= N: continue
    s = sig[:N - i] * g; gl, gr = np.sqrt((1 - pan) / 2) * 1.414, np.sqrt((1 + pan) / 2) * 1.414
    DL[i:i + len(s)] += s * gl; DR[i:i + len(s)] += s * gr
    WL[i:i + len(s)] += s * gl * send; WR[i:i + len(s)] += s * gr * send
ir_t = np.arange(int(2.8 * SR)) / SR
irL = rs.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.4); irR = rs.standard_normal(len(ir_t)) * np.exp(-ir_t * 2.4)
irL, irR = lp(irL, 6000), lp(irR, 6000)
irL /= np.sqrt((irL ** 2).sum()); irR /= np.sqrt((irR ** 2).sum())
L = DL + fftconvolve(WL, irL)[:N] * .55; R = DR + fftconvolve(WR, irR)[:N] * .55
mix = np.stack([L, R], 1)
mix = hp(mix.T, 25).T
mix = np.tanh(mix * 1.1 / np.percentile(np.abs(mix), 99.9)) * .89
fade = np.ones(N); fl = int(.6 * SR); fade[-fl:] = np.linspace(1, 0, fl) ** 2; mix *= fade[:, None]
pcm = (mix / np.abs(mix).max() * 0.89 * 32767).astype(np.int16)
with wave.open('audio.wav', 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('audio.wav', len(dry), 'events')

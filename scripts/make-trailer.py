import math, wave, struct
notes=[196,293.66,392,369.99,246.94,293.66,220,0,196,246.94,293.66,440,392,293.66,246.94,0]
rate=22050
with wave.open('output/trailer-score.wav','wb') as w:
 w.setnchannels(1);w.setsampwidth(2);w.setframerate(rate)
 buf=bytearray()
 for i in range(40*rate):
  t=i/rate;step=int(t/.42);pos=t% .42;n=notes[step%len(notes)];fade=min(1,t/2,(40-t)/2)
  tone=(math.sin(2*math.pi*n*t)*math.exp(-pos*5)*.13 if n else 0)+math.sin(2*math.pi*98*t)*.025
  buf+=struct.pack('<h',int(32767*tone*fade))
 w.writeframes(buf)

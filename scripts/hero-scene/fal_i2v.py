"""Seedance 2.0 image-to-video with first and last frame on fal. Key from ~/.config/fal/key (never printed).

  python3 fal_i2v.py <endpoint> <resolution> <duration> <aspect> <prompt.txt> <out.mp4> <first.png> <last.png>
"""
import base64, json, mimetypes, os, sys, time, urllib.request

endpoint, res, dur, aspect, pf, out, first, last = sys.argv[1:9]
key = open(os.path.expanduser('~/.config/fal/key')).read().strip()
H = {'Authorization': f'Key {key}', 'Content-Type': 'application/json'}
uri = lambda p: f'data:{mimetypes.guess_type(p)[0]};base64,' + base64.b64encode(open(p, 'rb').read()).decode()


def req(url, data=None):
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=H)
    try:
        return json.load(urllib.request.urlopen(r, timeout=180))
    except urllib.error.HTTPError as e:
        sys.exit(f'HTTP {e.code}: {e.read().decode()[:800]}')


sub = req(f'https://queue.fal.run/{endpoint}', {'prompt': open(pf).read().strip(), 'image_url': uri(first), 'end_image_url': uri(last),
                                                  'resolution': res, 'duration': dur, 'aspect_ratio': aspect, 'generate_audio': False})
while req(sub['status_url'])['status'] != 'COMPLETED':
    time.sleep(8)
r = req(sub['response_url'])
urllib.request.urlretrieve(r['video']['url'], out)
print('saved', out, 'seed', r.get('seed'))

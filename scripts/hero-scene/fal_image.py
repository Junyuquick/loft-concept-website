"""Nano Banana Pro edit on fal (image-to-image). Key from ~/.config/fal/key (never printed).

  python3 fal_image.py <out.png> <aspect> "<prompt>" <ref1> [ref2 ...]
"""
import base64, json, mimetypes, os, sys, time, urllib.request

out, aspect, prompt = sys.argv[1:4]
refs = sys.argv[4:]
key = open(os.path.expanduser('~/.config/fal/key')).read().strip()
H = {'Authorization': f'Key {key}', 'Content-Type': 'application/json'}
uri = lambda p: f'data:{mimetypes.guess_type(p)[0]};base64,' + base64.b64encode(open(p, 'rb').read()).decode()


def req(url, data=None):
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=H)
    try:
        return json.load(urllib.request.urlopen(r, timeout=180))
    except urllib.error.HTTPError as e:
        sys.exit(f'HTTP {e.code}: {e.read().decode()[:800]}')


sub = req('https://queue.fal.run/fal-ai/nano-banana-pro/edit',
          {'prompt': prompt, 'image_urls': [uri(p) for p in refs], 'aspect_ratio': aspect, 'num_images': 1, 'output_format': 'png', 'resolution': '1K'})
while req(sub['status_url'])['status'] != 'COMPLETED':
    time.sleep(4)
res = req(sub['response_url'])
urllib.request.urlretrieve(res['images'][0]['url'], out)
print('saved', out, res.get('description', '')[:200])

"""Seedance 2.0 reference-to-video on fal. Key from ~/.config/fal/key (never printed).

  python3 fal_seedance.py <endpoint> <resolution> <duration> <aspect> <prompt.txt> <out.mp4> <video_ref> <img1> [img2 ...]
References are passed in order, so the prompt can say @Image1, @Image2 ... and @Video1.
"""
import base64, json, mimetypes, os, sys, time, urllib.request

endpoint, res, dur, aspect, prompt_f, out, vid = sys.argv[1:8]
imgs = sys.argv[8:]
key = open(os.path.expanduser('~/.config/fal/key')).read().strip()
H = {'Authorization': f'Key {key}', 'Content-Type': 'application/json'}


def uri(p):
    t = mimetypes.guess_type(p)[0]
    return f'data:{t};base64,' + base64.b64encode(open(p, 'rb').read()).decode()


body = {'prompt': open(prompt_f).read().strip(), 'image_urls': [uri(p) for p in imgs], 'video_urls': [uri(vid)],
        'resolution': res, 'duration': dur, 'aspect_ratio': aspect, 'generate_audio': False}


def req(url, data=None):
    r = urllib.request.Request(url, data=json.dumps(data).encode() if data is not None else None, headers=H)
    try:
        return json.load(urllib.request.urlopen(r, timeout=120))
    except urllib.error.HTTPError as e:
        sys.exit(f'HTTP {e.code}: {e.read().decode()[:800]}')


sub = req(f'https://queue.fal.run/{endpoint}', body)
print('request', sub['request_id'], flush=True)
while True:
    s = req(sub['status_url'])
    print(s['status'], flush=True)
    if s['status'] == 'COMPLETED':
        break
    time.sleep(10)
res_ = req(sub['response_url'])
print(json.dumps({k: v for k, v in res_.items() if k != 'video'}), flush=True)
urllib.request.urlretrieve(res_['video']['url'], out)
print('saved', out, res_['video'].get('file_size'))

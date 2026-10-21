"""Generate a 3D model from a photo with Meshy. Key is read from ~/.config/meshy/key (never printed).

  python3 meshy_gen.py <image> <out.glb> [meshy-7.1]
"""
import base64, json, mimetypes, os, sys, time, urllib.request

img, out = sys.argv[1], sys.argv[2]
model = sys.argv[3] if len(sys.argv) > 3 else 'meshy-7.1'
key = open(os.path.expanduser('~/.config/meshy/key')).read().strip()
API = 'https://api.meshy.ai/openapi/v1'


def call(path, body=None):
    req = urllib.request.Request(API + path, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=60))


data = base64.b64encode(open(img, 'rb').read()).decode()
uri = f'data:{mimetypes.guess_type(img)[0]};base64,{data}'
tid = call('/image-to-3d', {'image_url': uri, 'ai_model': model, 'enable_pbr': True, 'should_texture': True,
                            'target_formats': ['glb']})['result']
print('task', tid, flush=True)
while True:
    t = call(f'/image-to-3d/{tid}')
    print(t['status'], t.get('progress'), flush=True)
    if t['status'] == 'SUCCEEDED':
        break
    if t['status'] in ('FAILED', 'CANCELED'):
        sys.exit(json.dumps(t.get('task_error')))
    time.sleep(10)
urllib.request.urlretrieve(t['model_urls']['glb'], out)
print('saved', out)

"""Text to 3D with Meshy (preview then refine/texture). Key from ~/.config/meshy/key, never printed.

  python3 meshy_text.py <name> "<prompt>"   -> assets/models/<name>.glb
"""
import json, os, sys, time, urllib.request

name, prompt = sys.argv[1], sys.argv[2]
key = open(os.path.expanduser('~/.config/meshy/key')).read().strip()
API = 'https://api.meshy.ai/openapi/v2/text-to-3d'


def call(url, body=None):
    req = urllib.request.Request(url, data=json.dumps(body).encode() if body else None,
                                 headers={'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=60))


def wait(tid):
    while True:
        t = call(f'{API}/{tid}')
        if t['status'] == 'SUCCEEDED':
            return t
        if t['status'] in ('FAILED', 'CANCELED'):
            sys.exit(f'{name}: {t["status"]} {t.get("task_error")}')
        time.sleep(10)


pid = call(API, {'mode': 'preview', 'prompt': prompt, 'ai_model': 'meshy-6', 'target_formats': ['glb']})['result']
wait(pid)
rid = call(API, {'mode': 'refine', 'preview_task_id': pid, 'enable_pbr': True, 'ai_model': 'meshy-6'})['result']
t = wait(rid)
urllib.request.urlretrieve(t['model_urls']['glb'], f'assets/models/{name}.glb')
print('saved', name)

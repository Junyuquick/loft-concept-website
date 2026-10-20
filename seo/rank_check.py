#!/usr/bin/env python3
"""Monthly live Google rank check for loftconcept.com.sg, through the local OpenSEO server.

Usage:  /usr/bin/python3 -I seo/rank_check.py
Needs OpenSEO running at http://localhost:3001 (see seo/MONTHLY-RANK-CHECK.md).
Records today's positions in seo/rank-history.json (one snapshot per day) and prints
a summary compared with the previous snapshot. Standard library only.
"""
import json, os, re, sys, time, urllib.request, datetime

HERE = os.path.dirname(os.path.abspath(__file__))
HISTORY = os.path.join(HERE, "rank-history.json")
MCP = "http://localhost:3001/mcp"
DOMAIN = "loftconcept.com.sg"
DEPTH = 40
KEYWORDS = [
    "interior design service singapore", "interior design company in singapore", "interior design firms in singapore",
    "interior designer singapore", "best interior design singapore", "luxury interior design singapore",
    "landed property interior design singapore", "landed house interior design singapore", "landed interior design singapore",
    "singapore condo interior design", "condominium interior design singapore", "hdb interior design",
    "hdb renovation contractor", "hdb registered renovation contractor", "hdb renovation", "renovation contractor singapore",
    "design and build singapore", "award winning interior design singapore", "residential interior design singapore",
    "condo renovation singapore", "hdb renovation permit", "hdb renovation timing", "hdb renovation guidelines",
    "loft concept", "loft concept singapore",
]


def call(name, args, timeout=180):
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {"name": name, "arguments": args}}).encode()
    req = urllib.request.Request(MCP, body, {"content-type": "application/json", "accept": "application/json, text/event-stream"})
    text = urllib.request.urlopen(req, timeout=timeout).read().decode()
    for line in text.splitlines():
        if line.startswith("data: "):
            text = line[6:]
    out = json.loads(text).get("result", {})
    return "\n".join(c.get("text", "") for c in out.get("content", []))


def wait_for_openseo(seconds=240):
    end = time.time() + seconds
    while time.time() < end:
        try:
            if urllib.request.urlopen("http://localhost:3001/api/health", timeout=5).status == 200:
                return True
        except Exception:
            time.sleep(5)
    return False


def project_id():
    listing = call("list_projects", {})
    for line in listing.splitlines():
        m = re.match(r"- ([0-9a-f-]{36})\s+.*" + re.escape(DOMAIN), line)
        if m:
            return m.group(1)
    raise SystemExit("No OpenSEO project for " + DOMAIN + " found. Create one with create_project (domain " + DOMAIN + ", location 2702, language en).")


def parse(text):
    results, current = {}, None
    for line in text.splitlines():
        m = re.match(r'^"(.*?)"( \(\d+ results\):|: FAILED)', line)
        if m:
            current = m.group(1)
            results[current] = {"organic": None, "url": None, "other": None, "failed": "FAILED" in m.group(2)}
            continue
        if current and DOMAIN in line:
            p = [x.strip() for x in line.split("|")]
            if len(p) > 5 and p[1] == "organic" and p[2].isdigit():
                r = results[current]
                if r["organic"] is None or int(p[2]) < r["organic"]:
                    r["organic"], r["url"] = int(p[2]), p[5]
            elif len(p) > 3 and p[1] in ("local_pack", "knowledge_graph"):
                results[current]["other"] = p[1]
    return results


def lookup(pid, keywords):
    results = {}
    for i in range(0, len(keywords), 8):
        chunk = keywords[i:i + 8]
        results.update(parse(call("get_serp_results", {"projectId": pid, "depth": DEPTH, "queries": [{"keyword": k} for k in chunk]})))
    failed = [k for k, v in results.items() if v["failed"]]
    if failed:  # the data provider is occasionally unavailable: retry those once
        time.sleep(10)
        results.update(parse(call("get_serp_results", {"projectId": pid, "depth": DEPTH, "queries": [{"keyword": k} for k in failed]})))
    return results


def main():
    if not wait_for_openseo():
        raise SystemExit("OpenSEO is not reachable at http://localhost:3001")
    pid = project_id()
    results = lookup(pid, KEYWORDS)
    today = datetime.datetime.now(datetime.timezone(datetime.timedelta(hours=8))).strftime("%Y-%m-%d")
    history = json.load(open(HISTORY)) if os.path.exists(HISTORY) else {"domain": DOMAIN, "market": "Singapore, Google, English, mobile, top 40", "snapshots": []}
    previous = next((s for s in reversed(history["snapshots"]) if s["date"] != today), None)
    history["snapshots"] = [s for s in history["snapshots"] if s["date"] != today]
    history["snapshots"].append({"date": today, "results": {k: {"organic": v["organic"], "url": v["url"], "other": v["other"]} for k, v in results.items() if not v["failed"]}})
    json.dump(history, open(HISTORY, "w"), indent=1)

    failed = [k for k, v in results.items() if v["failed"]]
    ranked = {k: v for k, v in results.items() if v["organic"] is not None and not v["failed"]}
    print(f"Rank check {today}: {len(ranked)} of {len(results) - len(failed)} phrases in the top {DEPTH}" + (f"; {len(failed)} lookups failed: {failed}" if failed else ""))
    print("\n| Phrase | Position | Previous | Change |\n|---|---|---|---|")
    for k in KEYWORDS:
        v = results.get(k)
        if not v or v["failed"]:
            print(f"| {k} | lookup failed | | |"); continue
        now = v["organic"]
        before = None if not previous else previous["results"].get(k, {}).get("organic", "n/a")
        label = lambda x: "not in top 40" if x is None else ("n/a" if x == "n/a" else str(x))
        if previous is None or before == "n/a": change = ""
        elif now == before: change = "no change"
        elif now is None: change = "dropped out"
        elif before is None: change = "new in top 40"
        else: change = ("up " if now < before else "down ") + str(abs(now - before))
        print(f"| {k} | {label(now)} | {label(before) if previous else ''} | {change} |")
    return 1 if failed and len(failed) == len(KEYWORDS) else 0


if __name__ == "__main__":
    sys.exit(main())

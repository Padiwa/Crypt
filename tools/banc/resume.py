# Crypte des Cendres — résumé d'un fichier de sortie de tools/banc/mission.mjs, par étiquette, mode, équipement, niveau et palier.
# Usage : python3 tools/banc/resume.py sortie.jsonl [autre.jsonl …]
# Survie et Capture : morts, manches, vie la plus basse (moyenne et pire partie), élites tuées, temps pour tuer un Gardien.
# Défense avec POD_IMM=1 : la vraie vie du cryopode est rejouée vague par vague (−dégâts de la vague, +8 % entre deux vagues,
# +30 % en continuant) ; « tient » = parties qui passent les 12 vagues ; « fin » = vague où le cryopode ou le héros tombe (médiane).
import json, sys, statistics as st, collections

def pod_fall(waves, regen=.08):
    hp = 1.0
    for o in waves:
        hp -= o['pod']
        if hp <= 0:
            return o['w']
        hp = min(1, hp + (.30 if o['w'] % 3 == 0 else regen))
    return None

rows = [json.loads(l) for f in sys.argv[1:] for l in open(f) if l.strip()]
g = collections.defaultdict(list)
for r in rows:
    g[(r.get('tag', ''), r['mode'], r['build'], r['level'], r['d'], r['torm'])].append(r)
for k in sorted(g):
    rs = g[k]; tag, mode, build, lvl, d, t = k
    head = f"{tag or '-'} · {mode} · {build} · niveau {lvl} · difficulté {d} palier {t} · {len(rs)} parties"
    if mode == 'defense' and rs[0].get('waves'):
        ends, held, W = [], 0, collections.defaultdict(list)
        for r in rs:
            pf = pod_fall(r['waves']); hd = r['wave'] if r['died'] else None
            e = min([x for x in (pf, hd) if x] or [99]); ends.append(13 if e == 99 else e); held += e == 99
            for o in r['waves']:
                W[o['w']].append(o['pod'])
        m = lambda ws: f"{round(100 * st.mean([st.mean(W[w]) for w in ws if W[w]]))} %" if any(W[w] for w in ws) else '—'
        print(f"{head}\n   tiennent 12 vagues : {held} · fin médiane : {'les 12 vagues' if st.median(ends) > 12 else 'vague ' + str(st.median(ends))} · dégâts au cryopode par vague : {m([1,2,3])} (vagues 1-3) → {m([10,11,12])} (10-12)"
              f" · vie la plus basse : {round(100*min(r['minHp'] for r in rs))} % · élites : {round(st.mean(r['elites'] for r in rs))}")
    else:
        ttk = [r['bossTTK'] for r in rs if r.get('bossTTK')]
        print(f"{head}\n   morts : {sum(r['died'] for r in rs)} ({', '.join(r['cls'] for r in rs if r['died']) or '-'}) · manches : {st.mean(r['rounds'] for r in rs):.2f}"
              f" · vie la plus basse : {round(100*st.mean(r['minHp'] for r in rs))} % (pire {round(100*min(r['minHp'] for r in rs))} %) · élites : {round(st.mean(r['elites'] for r in rs))}"
              + (f" · Gardien tué en {st.mean(ttk):.1f} s" if ttk else ''))

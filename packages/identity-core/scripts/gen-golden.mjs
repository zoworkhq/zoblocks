const enc = new TextEncoder();
function fnv(key){let h=0x811c9dc5;for(const b of enc.encode(key)){h^=b;h=Math.imul(h,0x01000193)>>>0;}return h>>>0;}
const rows=[];
for(let i=0;i<400;i++) rows.push(`pat-${String(i).padStart(4,"0")}`);
const extras=["","a","陳美琳","Amara Chinelo Okonkwo","रामेश","🙂","urn:uuid:9d1f4c2a-0000-4000-8000-00000000c4a2",
"9434765919","234567890124","Ferreira, Baby A","Ferreira, Baby B","van der Meer","O'Brien",
"Ánh Nguyên","Anh Nguyen","ZZZTEST","  ","\t","\n","x".repeat(256)];
for(const e of extras) rows.push(e);
const out=["# identity-core swatch golden file","# key<TAB>swatch index over 6 buckets","# Regenerate: node scripts/gen-golden.mjs > test/__golden__/swatch.tsv"];
for(const k of rows) out.push(`${JSON.stringify(k)}\t${fnv(k)%6}`);
console.log(out.join("\n"));

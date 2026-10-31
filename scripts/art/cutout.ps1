# Recorta as ilustrações de referência (JPEG com fundo creme) em PNGs com fundo transparente.
# Uso, na raiz do projeto:  powershell -ExecutionPolicy Bypass -File scripts/art/cutout.ps1
# Os recortes (posição de cada fase, rótulos a apagar) ficam em scripts/art/jobs.json.
param([string]$JobsFile = "scripts/art/jobs.json")

Add-Type -ReferencedAssemblies System.Drawing -TypeDefinition @"
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;

public static class Cutout {
    // Recorta, apaga retângulos (rótulos "Fase N"), torna transparente o fundo creme ligado às bordas
    // (flood fill, para não furar o interior das figuras), apara e salva PNG.
    public static string Run(string src, int x, int y, int w, int h, int[] erase, int tLow, int tHigh, string outPath) {
        using (var full = new Bitmap(src)) {
            var bmp = full.Clone(new Rectangle(x, y, w, h), PixelFormat.Format32bppArgb);
            var data = bmp.LockBits(new Rectangle(0, 0, w, h), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
            int stride = data.Stride;
            byte[] px = new byte[stride * h];
            System.Runtime.InteropServices.Marshal.Copy(data.Scan0, px, 0, px.Length);

            // Cor de fundo: média dos pixels dos cantos.
            long rb = 0, gb = 0, bb = 0; int n = 0;
            int[][] corners = { new[]{0,0}, new[]{w-6,0}, new[]{0,h-6}, new[]{w-6,h-6} };
            foreach (var c in corners)
                for (int j = 0; j < 6; j++) for (int i = 0; i < 6; i++) {
                    int o = (c[1]+j)*stride + (c[0]+i)*4; bb += px[o]; gb += px[o+1]; rb += px[o+2]; n++;
                }
            byte br = (byte)(rb/n), bg = (byte)(gb/n), bbl = (byte)(bb/n);

            // Apaga rótulos pintando com a cor de fundo (coordenadas relativas à imagem original).
            for (int k = 0; k + 3 < erase.Length; k += 4) {
                for (int j = erase[k+1] - y; j < erase[k+1] - y + erase[k+3]; j++)
                    for (int i = erase[k] - x; i < erase[k] - x + erase[k+2]; i++) {
                        if (i < 0 || j < 0 || i >= w || j >= h) continue;
                        int o = j*stride + i*4; px[o] = bbl; px[o+1] = bg; px[o+2] = br;
                    }
            }

            Func<int, double> dist = (o) => {
                double db = px[o]-bbl, dg = px[o+1]-bg, dr = px[o+2]-br;
                return Math.Sqrt(db*db + dg*dg + dr*dr);
            };

            var seen = new bool[w*h];
            var q = new Queue<int>();
            for (int i = 0; i < w; i++) { q.Enqueue(i); q.Enqueue((h-1)*w + i); }
            for (int j = 0; j < h; j++) { q.Enqueue(j*w); q.Enqueue(j*w + w-1); }
            while (q.Count > 0) {
                int p = q.Dequeue();
                if (seen[p]) continue;
                int i = p % w, j = p / w, o = j*stride + i*4;
                double d = dist(o);
                if (d >= tHigh) continue;
                seen[p] = true;
                int a = d <= tLow ? 0 : (int)(255.0 * (d - tLow) / (tHigh - tLow));
                px[o+3] = (byte)Math.Min(px[o+3], a);
                if (i > 0) q.Enqueue(p-1); if (i < w-1) q.Enqueue(p+1);
                if (j > 0) q.Enqueue(p-w); if (j < h-1) q.Enqueue(p+w);
            }

            // Segunda passada: manchas grandes de fundo presas dentro do desenho (ex.: entre guindaste e foguete).
            var visited = new bool[w*h];
            for (int start = 0; start < w*h; start++) {
                if (seen[start] || visited[start]) continue;
                int si = start % w, sj = start / w;
                if (dist(sj*stride + si*4) > tLow) continue;
                var comp = new List<int>();
                var cq = new Queue<int>(); cq.Enqueue(start); visited[start] = true;
                while (cq.Count > 0) {
                    int p = cq.Dequeue(); comp.Add(p);
                    int i = p % w, j = p / w;
                    int[] nb = { i > 0 ? p-1 : -1, i < w-1 ? p+1 : -1, j > 0 ? p-w : -1, j < h-1 ? p+w : -1 };
                    foreach (int t in nb) {
                        if (t < 0 || visited[t] || seen[t]) continue;
                        int ti = t % w, tj = t / w;
                        if (dist(tj*stride + ti*4) > tLow + 6) continue;
                        visited[t] = true; cq.Enqueue(t);
                    }
                }
                if (comp.Count < 150) continue;
                foreach (int p in comp) { int i = p % w, j = p / w; px[j*stride + i*4 + 3] = 0; }
            }

            // Caixa delimitadora do que sobrou.
            int minX = w, minY = h, maxX = -1, maxY = -1;
            for (int j = 0; j < h; j++) for (int i = 0; i < w; i++)
                if (px[j*stride + i*4 + 3] > 24) { if (i<minX) minX=i; if (i>maxX) maxX=i; if (j<minY) minY=j; if (j>maxY) maxY=j; }
            System.Runtime.InteropServices.Marshal.Copy(px, 0, data.Scan0, px.Length);
            bmp.UnlockBits(data);

            int pad = 4;
            minX = Math.Max(0, minX-pad); minY = Math.Max(0, minY-pad);
            maxX = Math.Min(w-1, maxX+pad); maxY = Math.Min(h-1, maxY+pad);
            using (var trimmed = bmp.Clone(new Rectangle(minX, minY, maxX-minX+1, maxY-minY+1), PixelFormat.Format32bppArgb)) {
                trimmed.Save(outPath, ImageFormat.Png);
                bmp.Dispose();
                return string.Format("{0} {1}x{2} bg=({3},{4},{5})", outPath, trimmed.Width, trimmed.Height, br, bg, bbl);
            }
        }
    }
}
"@

$root = (Get-Location).Path
$jobs = Get-Content $JobsFile -Raw -Encoding UTF8 | ConvertFrom-Json
foreach ($j in $jobs) {
    $erase = @()
    if ($j.erase) { $erase = [int[]]$j.erase }
    $out = Join-Path $root $j.out
    New-Item -ItemType Directory -Force (Split-Path $out) | Out-Null
    [Cutout]::Run((Join-Path $root $j.src), $j.x, $j.y, $j.w, $j.h, $erase, $j.tLow, $j.tHigh, $out)
}

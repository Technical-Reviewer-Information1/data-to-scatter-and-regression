(function () {
  'use strict';
  const C = window.Chart, T = window.Tools, $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  function el(n, a, t) { const e = document.createElementNS(NS, n); for (const k in a) if (a[k] != null) e.setAttribute(k, a[k]); if (t != null) e.textContent = t; return e; }

  const DATA = {
    study: { name: '学習時間と点数', xLabel: '1日の学習時間（時間）', yLabel: '小テストの点数（点）',
      xUnit: '時間', yUnit: '点', xMax: 8, yMax: 100,
      pts: [[0.5, 32], [1, 41], [1.5, 44], [2, 52], [2.5, 55], [3, 61], [3.5, 58], [4, 70], [4.5, 74], [5, 76], [5.5, 84], [6, 88]] },
    temp: { name: '気温とアイスの売上', xLabel: '最高気温（℃）', yLabel: 'アイスの売上（万円）',
      xUnit: '℃', yUnit: '万円', xMax: 40, yMax: 140,
      pts: [[10, 22], [13, 30], [16, 41], [18, 44], [21, 58], [23, 61], [25, 74], [27, 79], [29, 92], [31, 96], [33, 110], [35, 118]] },
    weak: { name: '関係がうすい例', xLabel: '通学時間（分）', yLabel: '小テストの点数（点）',
      xUnit: '分', yUnit: '点', xMax: 60, yMax: 100,
      pts: [[5, 62], [10, 55], [12, 78], [18, 49], [22, 71], [25, 58], [30, 66], [33, 52], [38, 74], [42, 60], [48, 68], [55, 57]] }
  };
  let key = 'study', pts = DATA.study.pts.map(p => p.slice());
  let a = 1, b = 0;

  function best() {
    const n = pts.length;
    const mx = pts.reduce((s, p) => s + p[0], 0) / n, my = pts.reduce((s, p) => s + p[1], 0) / n;
    let sxy = 0, sxx = 0, syy = 0;
    pts.forEach(p => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; syy += (p[1] - my) ** 2; });
    const A = sxx ? sxy / sxx : 0, B = my - A * mx;
    const r = (sxx && syy) ? sxy / Math.sqrt(sxx * syy) : 0;
    const rssBest = pts.reduce((s, p) => s + (p[1] - (A * p[0] + B)) ** 2, 0);
    return { A, B, mx, my, r, rssBest, syy };
  }
  function rssOf(A, B) { return pts.reduce((s, p) => s + (p[1] - (A * p[0] + B)) ** 2, 0); }

  /* ---------- STEP1 図 ---------- */
  const W = 460, H = 350, M = { t: 16, r: 16, b: 42, l: 50 };
  const IW = W - M.l - M.r, IH = H - M.t - M.b;
  function drawFit() {
    const d = DATA[key], bs = best();
    const X = v => M.l + v / d.xMax * IW;
    const Y = v => M.t + IH - v / d.yMax * IH;
    const box = $('fitBox'); box.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, width: '100%', role: 'img', 'aria-label': '散布図と自分で引いた直線' });
    svg.style.display = 'block';
    const xs = 5, ys = 5;
    for (let i = 0; i <= xs; i++) {
      const v = d.xMax * i / xs;
      svg.appendChild(el('line', { x1: X(v), y1: M.t, x2: X(v), y2: M.t + IH, stroke: '#ebe8e2' }));
      svg.appendChild(el('text', { x: X(v), y: M.t + IH + 15, 'text-anchor': 'middle', 'font-size': 10, fill: '#858a92', 'font-family': 'monospace' }, Math.round(v * 10) / 10));
    }
    for (let i = 0; i <= ys; i++) {
      const v = d.yMax * i / ys;
      svg.appendChild(el('line', { x1: M.l, y1: Y(v), x2: M.l + IW, y2: Y(v), stroke: '#ebe8e2' }));
      svg.appendChild(el('text', { x: M.l - 7, y: Y(v), 'text-anchor': 'end', 'dominant-baseline': 'middle', 'font-size': 10, fill: '#858a92', 'font-family': 'monospace' }, Math.round(v)));
    }
    svg.appendChild(el('line', { x1: M.l, y1: M.t, x2: M.l, y2: M.t + IH, stroke: '#4a4f57', 'stroke-width': 1.4 }));
    svg.appendChild(el('line', { x1: M.l, y1: M.t + IH, x2: M.l + IW, y2: M.t + IH, stroke: '#4a4f57', 'stroke-width': 1.4 }));
    svg.appendChild(el('text', { x: M.l + IW / 2, y: H - 6, 'text-anchor': 'middle', 'font-size': 11, fill: '#4a4f57' }, d.xLabel));
    svg.appendChild(el('text', { x: 12, y: M.t + IH / 2, 'text-anchor': 'middle', 'font-size': 11, fill: '#4a4f57',
      transform: `rotate(-90 12 ${M.t + IH / 2})` }, d.yLabel));
    // 残差
    pts.forEach(p => {
      const yh = a * p[0] + b;
      svg.appendChild(el('line', { x1: X(p[0]), y1: Y(p[1]), x2: X(p[0]), y2: Y(Math.max(-20, Math.min(d.yMax * 1.2, yh))),
        stroke: '#b3261e', 'stroke-width': 1.6 }));
    });
    // 直線
    const y0 = b, y1 = a * d.xMax + b;
    svg.appendChild(el('line', { x1: X(0), y1: Y(y0), x2: X(d.xMax), y2: Y(y1), stroke: '#123a6b', 'stroke-width': 2.4 }));
    // 平均点
    svg.appendChild(el('circle', { cx: X(bs.mx), cy: Y(bs.my), r: 6, fill: 'none', stroke: '#8a5a00', 'stroke-width': 2.6 }));
    // データ点
    pts.forEach(p => svg.appendChild(el('circle', { cx: X(p[0]), cy: Y(p[1]), r: 5, fill: 'rgba(18,58,107,.75)', stroke: '#fff', 'stroke-width': 1.2 })));
    box.appendChild(svg);
    updateNumbers();
  }

  function updateNumbers() {
    const d = DATA[key], bs = best();
    const rss = rssOf(a, b);
    $('eqNow').textContent = 'y = ' + a.toFixed(2) + 'x ' + (b >= 0 ? '+ ' : '− ') + Math.abs(b).toFixed(1);
    $('slopeV').textContent = a.toFixed(2);
    $('interceptV').textContent = b.toFixed(0);
    $('rssVal').textContent = rss.toFixed(1);
    const ratio = Math.min(1, bs.rssBest / Math.max(rss, 1e-9));
    const bar = $('rssBar');
    bar.style.width = (ratio * 100) + '%';
    bar.className = ratio > 0.985 ? 'best' : '';
    const gap = rss - bs.rssBest;
    const n = $('fitNote');
    if (gap < bs.rssBest * 0.02) {
      n.className = 'note ok';
      n.innerHTML = '<strong>ほぼ最小です。</strong>これ以上小さくするのは無理。この直線が回帰直線 <span class="mono">y = ' +
        bs.A.toFixed(2) + 'x ' + (bs.B >= 0 ? '+ ' : '− ') + Math.abs(bs.B).toFixed(1) + '</span> です。';
    } else if (gap < bs.rssBest * 0.3) {
      n.className = 'note info';
      n.innerHTML = 'かなり近づきました。最小との差は <strong>' + gap.toFixed(1) + '</strong>。もう少し調整できます。';
    } else {
      n.className = 'note warn';
      n.innerHTML = '赤い縦線がまだ長いところがあります。最小との差は <strong>' + gap.toFixed(1) +
        '</strong>。橙色の○（平均の点）を通るようにするのがコツです。';
    }
    $('sumRes').textContent = pts.reduce((s, p) => s + (p[1] - (a * p[0] + b)), 0).toFixed(1);
    $('sumSq').textContent = rss.toFixed(1);
    $('bestSq').textContent = bs.rssBest.toFixed(1);
    $('gapSq').textContent = gap.toFixed(1);
    drawSquares();
    drawPred();
    drawR2();
  }

  function drawSquares() {
    const box = $('sqBox2'); box.innerHTML = '';
    const res = pts.map(p => p[1] - (a * p[0] + b));
    const maxAbs = Math.max(...res.map(Math.abs), 1);
    const scale = 50 / maxAbs;
    const cw = 44, W2 = pts.length * cw + 20, H2 = 130;
    const svg = el('svg', { viewBox: `0 0 ${W2} ${H2}`, width: '100%', role: 'img', 'aria-label': 'はずれの2乗を表す正方形' });
    const baseY = H2 - 22;
    res.forEach((d, i) => {
      const s = Math.abs(d) * scale, x = 10 + i * cw;
      svg.appendChild(el('rect', { x: x, y: baseY - s, width: Math.max(1, s), height: Math.max(1, s),
        fill: 'rgba(179,38,30,.14)', stroke: '#b3261e', 'stroke-width': 1.1 }));
      svg.appendChild(el('text', { x: x + s / 2, y: baseY + 12, 'text-anchor': 'middle', 'font-size': 9,
        fill: '#4a4f57', 'font-family': 'monospace' }, (d >= 0 ? '+' : '') + d.toFixed(1)));
    });
    box.appendChild(svg);
  }

  /* ---------- STEP3 予測 ---------- */
  function drawPred() {
    const d = DATA[key], bs = best();
    const sl = $('predX');
    sl.max = d.xMax * 2; sl.step = d.xMax / 40;
    const x = +sl.value;
    $('predXv').textContent = x + ' ' + d.xUnit;
    const yh = bs.A * x + bs.B;
    $('predEq').textContent = 'ŷ = ' + bs.A.toFixed(2) + ' × ' + x + ' ' + (bs.B >= 0 ? '+ ' : '− ') +
      Math.abs(bs.B).toFixed(1) + ' = ' + yh.toFixed(1) + ' ' + d.yUnit;
    const xs = pts.map(p => p[0]);
    const lo = Math.min(...xs), hi = Math.max(...xs);
    const n = $('predNote');
    if (x < lo || x > hi) {
      n.className = 'note ng';
      n.innerHTML = '<strong>データの範囲（' + lo + '〜' + hi + d.xUnit + '）の外です。</strong>' +
        'ここでの予測はあてになりません。実際の関係が直線のまま続く保証はないからです。これを<strong>外挿</strong>といいます。' +
        (yh < 0 ? '　実際、予測値が負になっており、現実にはありえない値です。' : '');
    } else {
      n.className = 'note ok';
      n.innerHTML = 'データの範囲の中なので、この予測はある程度信頼できます。ただし個々のデータは直線から外れているので、あくまで目安です。';
    }
    const tb = $('predTable').tBodies[0]; tb.innerHTML = '';
    pts.forEach((p, i) => {
      const y = bs.A * p[0] + bs.B, e = p[1] - y;
      const tr = document.createElement('tr');
      tr.innerHTML = '<td>' + (i + 1) + '</td><td>' + p[0] + '</td><td>' + p[1] + '</td><td>' + y.toFixed(1) +
        '</td><td style="color:' + (Math.abs(e) > 6 ? 'var(--ng)' : 'var(--ink-2)') + '">' + (e >= 0 ? '+' : '') + e.toFixed(1) + '</td>';
      tb.appendChild(tr);
    });
  }

  /* ---------- STEP4 R² ---------- */
  function drawR2() {
    const bs = best();
    const r2 = bs.r * bs.r;
    $('mR').textContent = (bs.r >= 0 ? '+' : '') + bs.r.toFixed(3);
    $('mR2').textContent = r2.toFixed(3);
    $('mPct').textContent = (r2 * 100).toFixed(1) + '％';
    C.bar($('r2Chart'), { W: 560, H: 220, labels: ['直線で説明できた分', '説明できない分（はずれ）'],
      values: [+(r2 * 100).toFixed(1), +((1 - r2) * 100).toFixed(1)],
      colors: ['#123a6b', '#b3261e'], yMin: 0, yMax: 100, unit: '%' });
    const n = $('r2Note');
    if (r2 > 0.7) { n.className = 'note ok'; n.innerHTML = 'R² が大きく、<strong>直線がよくあてはまっています</strong>。x から y をかなり正確に予測できます。'; }
    else if (r2 > 0.3) { n.className = 'note info'; n.innerHTML = 'ほどほどのあてはまりです。傾向はつかめますが、個々のずれも大きめです。'; }
    else { n.className = 'note warn'; n.innerHTML = 'R² が小さく、<strong>直線ではほとんど説明できていません</strong>。この2つの変数に直線的な関係は薄いということです。'; }
  }

  /* ---------- STEP5 クイズ ---------- */
  const QUIZ = [
    { t: '回帰直線が必ず通る点はどれか。', choices: ['（xの平均, yの平均）', '原点（0,0）', '最大値の点', '中央値の点'], a: '（xの平均, yの平均）',
      why: '最小二乗法で求めた回帰直線は、必ず（x̄, ȳ）を通ります。計算問題でよく使う性質です。' },
    { t: '回帰式 y = 8x + 30 において、傾き 8 の意味はどれか。', choices: ['x が1増えると y は8増える', 'x が8増えると y は1増える', 'y の平均が8', 'x が0のとき y は8'], a: 'x が1増えると y は8増える',
      why: '傾きは「x が1単位増えたときの y の変化量」です。切片30は x＝0 のときの予測値です。' },
    { t: '最小二乗法は何を最小にする方法か。', choices: ['はずれ（残差）の2乗の合計', 'はずれの合計', 'はずれの最大値', '相関係数'], a: 'はずれ（残差）の2乗の合計',
      why: 'はずれをそのまま足すと打ち消しあって0になってしまうため、2乗してから合計し、それを最小にします。' },
    { t: '相関係数が −0.6 のとき、決定係数 R² はいくらか。', choices: ['0.36', '−0.36', '0.6', '0.77'], a: '0.36',
      why: '単回帰では R² ＝ r²。(−0.6)² ＝ 0.36 です。R² は負にならず、0〜1の値をとります。' },
    { t: 'データが 1〜6 時間の範囲しかないのに、20時間のときの点数を回帰式で予測した。この扱いはどうか。', choices: ['範囲外なので信頼できない', '式に入れれば正しい', '相関係数が高ければ正しい', 'R²が高ければ正しい'], a: '範囲外なので信頼できない',
      why: 'データの範囲外での予測を外挿といいます。その範囲でも同じ直線関係が続く保証はないため、信頼できません。' },
    { t: 'R² が 0.85 と高い。このとき言えることはどれか。', choices: ['直線でよく説明できている', 'x が y の原因である', 'データに誤りがない', '相関係数は0.85'], a: '直線でよく説明できている',
      why: 'あてはまりのよさを表すだけで、因果関係の証拠にはなりません。また相関係数は √0.85 ≒ 0.92（符号は傾きによる）です。' }
  ];
  let qList = [], qi = 0, qScore = 0;
  const shuffle = x => { x = x.slice(); for (let i = x.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [x[i], x[j]] = [x[j], x[i]]; } return x; };
  function startQuiz() { qList = shuffle(QUIZ); qi = 0; qScore = 0; renderQ(); }
  function renderQ() {
    if (qi >= qList.length) {
      $('qText').textContent = qScore + ' / ' + qList.length + ' 問正解';
      $('qChoices').innerHTML = ''; $('qFb').hidden = true; $('qNext').disabled = true;
      $('qProgress').textContent = qList.length + ' / ' + qList.length; return;
    }
    const it = qList[qi];
    $('qProgress').textContent = (qi + 1) + ' / ' + qList.length;
    $('qScore').textContent = qScore;
    $('qText').textContent = it.t;
    const box = $('qChoices'); box.className = 'choice4'; box.innerHTML = '';
    shuffle(it.choices).forEach(c => {
      const bt = document.createElement('button');
      bt.className = 'btn'; bt.textContent = c; bt.dataset.c = c;
      bt.addEventListener('click', () => answerQ(c));
      box.appendChild(bt);
    });
    $('qFb').hidden = true; $('qNext').disabled = true;
    $('qNext').textContent = (qi === qList.length - 1) ? '結果を見る' : '次の問題';
  }
  function answerQ(c) {
    const it = qList[qi], ok = c === it.a, box = $('qChoices');
    box.classList.add('locked');
    [...box.children].forEach(bt => {
      if (bt.dataset.c === it.a) bt.classList.add('correct');
      else if (bt.dataset.c === c) bt.classList.add('wrong');
    });
    if (ok) qScore++;
    const fb = $('qFb');
    fb.className = 'note ' + (ok ? 'ok' : 'ng');
    fb.innerHTML = (ok ? '正解。' : '正解は <strong>' + it.a + '</strong>。') + it.why;
    fb.hidden = false;
    $('qScore').textContent = qScore; $('qNext').disabled = false;
  }

  function setData(k) {
    key = k; pts = DATA[k].pts.map(p => p.slice());
    document.querySelectorAll('[data-data]').forEach(x => x.setAttribute('aria-pressed', x.dataset.data === k));
    const d = DATA[k], bs = best();
    $('slope').min = (bs.A - Math.abs(bs.A) * 3 - 2).toFixed(2);
    $('slope').max = (bs.A + Math.abs(bs.A) * 3 + 2).toFixed(2);
    $('slope').step = (($('slope').max - $('slope').min) / 300).toFixed(3);
    $('intercept').min = Math.round(bs.B - d.yMax * .6);
    $('intercept').max = Math.round(bs.B + d.yMax * .6);
    a = +$('slope').min + (+$('slope').max - +$('slope').min) * .25;
    b = +$('intercept').min + (+$('intercept').max - +$('intercept').min) * .75;
    $('slope').value = a; $('intercept').value = b;
    $('predX').value = d.xMax / 2;
    drawFit();
  }


  /* ---------- STEP6 自分のデータ ---------- */
  let grid = null, gh = [];
  function refreshCols(rows, hdr) {
    gh = hdr;
    const nums = grid.numericColumns();
    [['mx', 0], ['my', 1]].forEach(([id, def]) => {
      const sel = $(id), prev = sel.value;
      sel.innerHTML = hdr.map((h, j) => '<option value="' + j + '"' + (nums.indexOf(j) < 0 ? ' disabled' : '') +
        '>' + h + (nums.indexOf(j) < 0 ? '（数値でない列）' : '') + '</option>').join('');
      if (prev !== '' && sel.querySelector('option[value="' + prev + '"]:not([disabled])')) sel.value = prev;
      else if (nums.length) sel.value = nums[Math.min(def, nums.length - 1)];
    });
    calcMine();
  }
  function calcMine() {
    if (!grid) return;
    const G = window.DataGrid;
    const xj = +$('mx').value, yj = +$('my').value;
    const rows = grid.getData();
    const pts = rows.map(r => [G.strNum(r[xj]), G.strNum(r[yj])]).filter(p => p[0] != null && p[1] != null);
    const n = $('myNote');
    if (pts.length < 3) {
      n.hidden = false; n.className = 'note ng';
      n.textContent = '数値の組が3つ以上必要です。2つの数値の列をえらんでください。';
      ['myStats', 'myChart', 'myTable', 'myTools'].forEach(i => $(i).innerHTML = '');
      $('myEq').textContent = '';
      return;
    }
    const N = pts.length;
    const mx = pts.reduce((a, p) => a + p[0], 0) / N, my = pts.reduce((a, p) => a + p[1], 0) / N;
    let sxy = 0, sxx = 0, syy = 0;
    pts.forEach(p => { sxy += (p[0] - mx) * (p[1] - my); sxx += (p[0] - mx) ** 2; syy += (p[1] - my) ** 2; });
    const A = sxx ? sxy / sxx : 0, B = my - A * mx;
    const r = (sxx && syy) ? sxy / Math.sqrt(sxx * syy) : 0;
    const rss = pts.reduce((a, p) => a + (p[1] - (A * p[0] + B)) ** 2, 0);
    $('myEq').textContent = 'y = ' + A.toFixed(4) + 'x ' + (B >= 0 ? '+ ' : '− ') + Math.abs(B).toFixed(3);
    $('myStats').innerHTML =
      '<div class="metric"><div class="k">データ数</div><div class="v">' + N + '</div></div>' +
      '<div class="metric"><div class="k">相関係数 r</div><div class="v">' + (r >= 0 ? '+' : '') + r.toFixed(3) + '</div></div>' +
      '<div class="metric"><div class="k">決定係数 R²</div><div class="v">' + (r * r).toFixed(3) + '</div></div>' +
      '<div class="metric"><div class="k">残差平方和</div><div class="v">' + rss.toFixed(2) + '</div></div>';
    C.scatter($('myChart'), { W: 460, H: 380, points: pts, regression: true,
      xLabel: gh[xj] || 'x', yLabel: gh[yj] || 'y' });
    const body = pts.slice(0, 40).map((p, i) => {
      const yh = A * p[0] + B, e = p[1] - yh;
      return '<tr><td>' + (i + 1) + '</td><td>' + p[0] + '</td><td>' + p[1] + '</td><td>' + yh.toFixed(2) +
        '</td><td style="color:' + (Math.abs(e) > Math.sqrt(rss / N) * 1.5 ? 'var(--ng)' : 'var(--ink-2)') + '">' +
        (e >= 0 ? '+' : '') + e.toFixed(2) + '</td></tr>';
    }).join('');
    $('myTable').innerHTML = '<thead><tr><th>#</th><th>' + (gh[xj] || 'x') + '</th><th>' + (gh[yj] || 'y') +
      '</th><th>予測 ŷ</th><th>残差</th></tr></thead><tbody>' + body + '</tbody>' +
      (pts.length > 40 ? '<tfoot><tr><td colspan="5">…ほか ' + (pts.length - 40) + ' 件</td></tr></tfoot>' : '');
    const xs = pts.map(p => p[0]);
    n.hidden = false; n.className = r * r > .5 ? 'note ok' : 'note info';
    n.innerHTML = '回帰式は <strong>y = ' + A.toFixed(3) + 'x ' + (B >= 0 ? '+ ' : '− ') + Math.abs(B).toFixed(2) +
      '</strong>。x が1増えると y は <strong>' + A.toFixed(3) + '</strong> 変化する、という意味です。' +
      'R² は ' + (r * r).toFixed(3) + ' なので、y のばらつきの <strong>' + (r * r * 100).toFixed(1) +
      '％</strong>をこの直線で説明できています。' +
      '<br>予測に使ってよいのは x が <strong>' + Math.min(...xs) + '〜' + Math.max(...xs) +
      '</strong> の範囲まで。その外は外挿になるので注意してください。';
    $('myTools').innerHTML = '';
    $('myTools').appendChild(T.saveButton(() => $('myChart').querySelector('svg'), '散布図と回帰直線'));
    const sh = document.createElement('button');
    sh.className = 'btn sm ghost'; sh.textContent = 'このデータのURLを作る';
    sh.addEventListener('click', () => T.share({ d: grid.getRaw(), h: grid.getHeader(), x: xj, y: yj }, sh));
    $('myTools').appendChild(sh);
    const pr = document.createElement('button');
    pr.className = 'btn sm ghost'; pr.textContent = '印刷する';
    pr.addEventListener('click', T.printPage);
    $('myTools').appendChild(pr);
  }

  function init() {
    $('slope').addEventListener('input', e => { a = +e.target.value; drawFit(); });
    $('intercept').addEventListener('input', e => { b = +e.target.value; drawFit(); });
    $('showBest').addEventListener('click', () => {
      const bs = best();
      a = Math.max(+$('slope').min, Math.min(+$('slope').max, bs.A));
      b = Math.max(+$('intercept').min, Math.min(+$('intercept').max, bs.B));
      $('slope').value = a; $('intercept').value = b; drawFit();
    });
    $('resetFit').addEventListener('click', () => setData(key));
    document.querySelectorAll('[data-data]').forEach(x => x.addEventListener('click', () => setData(x.dataset.data)));
    $('predX').addEventListener('input', drawPred);
    $('qNext').addEventListener('click', () => { qi++; renderQ(); });
    $('qReset').addEventListener('click', startQuiz);
    ['mx', 'my'].forEach(i => $(i).addEventListener('change', calcMine));
    $('calcMine').addEventListener('click', calcMine);
    const shared = T.readShared();
    const initData = (shared && shared.d) ? shared.d : [
      ['1番','0.5','32'],['2番','1','41'],['3番','1.5','44'],['4番','2','52'],['5番','2.5','55'],
      ['6番','3','61'],['7番','3.5','58'],['8番','4','70'],['9番','4.5','74'],['10番','5','76'],
      ['11番','5.5','84'],['12番','6','88']
    ];
    const initHeader = (shared && shared.h) ? shared.h : ['生徒', '学習時間(時間)', '点数(点)'];
    grid = window.DataInput.create($('dataInput'), {
      header: initHeader, data: initData, minRows: 3, onChange: refreshCols
    });
    window.Terms.glossary($('glossBox'), ['散布図', '回帰直線', '最小二乗法', '残差', '決定係数', '相関係数', '外挿', '因果関係']);
    setData('study'); startQuiz();
    refreshCols(grid.getData(), grid.getHeader());
    window.Terms.attach();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

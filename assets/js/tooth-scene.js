/* ==========================================================================
   FACE CLINIC — Escultura 3D (Three.js)
   --------------------------------------------------------------------------
   Um molar em "porcelana" modelado proceduralmente (campo de distância
   assinada + surface nets), com anéis dourados em órbita, iluminação de
   estúdio e reflexos suaves. Carregado sob demanda: o Three.js só é baixado
   quando a seção de tratamentos se aproxima da tela.

   API: ToothScene.prepare()            → gera a geometria em segundo plano
        ToothScene.mount(stage, opts)   → Promise<{ focus(i), setProgress(p), dispose() } | null>
   ========================================================================== */
(function () {
  'use strict';

  // Cede a vez ao navegador entre blocos de cálculo (sem depender de requestAnimationFrame,
  // que fica pausado em abas ocultas).
  var yieldChannel = new MessageChannel();
  var yieldQueue = [];
  yieldChannel.port1.onmessage = function () { var r = yieldQueue.shift(); if (r) r(); };
  var nextFrame = function () {
    if (window.scheduler && typeof window.scheduler.yield === 'function') return window.scheduler.yield();
    return new Promise(function (r) { yieldQueue.push(r); yieldChannel.port2.postMessage(0); });
  };

  /* ---------- Campo de distância do dente --------------------------------- */
  function makeToothSDF() {
    var sqrt = Math.sqrt, abs = Math.abs, max = Math.max, min = Math.min;

    function ellipsoid(x, y, z, rx, ry, rz) {
      var k0 = sqrt((x * x) / (rx * rx) + (y * y) / (ry * ry) + (z * z) / (rz * rz));
      var k1 = sqrt((x * x) / (rx * rx * rx * rx) + (y * y) / (ry * ry * ry * ry) + (z * z) / (rz * rz * rz * rz));
      return k1 > 1e-9 ? (k0 * (k0 - 1)) / k1 : -min(rx, ry, rz);
    }
    function sphere(x, y, z, r) { return sqrt(x * x + y * y + z * z) - r; }
    function smin(a, b, k) { var h = max(k - abs(a - b), 0) / k; return min(a, b) - h * h * k * 0.25; }
    function smax(a, b, k) { return -smin(-a, -b, k); }

    // Cone arredondado entre dois pontos (Inigo Quilez)
    function roundCone(ax, ay, az, bx, by, bz, r1, r2) {
      var bax = bx - ax, bay = by - ay, baz = bz - az;
      var l2 = bax * bax + bay * bay + baz * baz;
      var rr = r1 - r2, a2 = l2 - rr * rr, il2 = 1 / l2;
      var srr = Math.sign(rr) * rr * rr;
      return function (x, y, z) {
        var pax = x - ax, pay = y - ay, paz = z - az;
        var yy = pax * bax + pay * bay + paz * baz;
        var zz = yy - l2;
        var qx = pax * l2 - bax * yy, qy = pay * l2 - bay * yy, qz = paz * l2 - baz * yy;
        var x2 = qx * qx + qy * qy + qz * qz;
        var y2 = yy * yy * l2, z2 = zz * zz * l2;
        var k = srr * x2;
        if (Math.sign(zz) * a2 * z2 > k) return sqrt(x2 + z2) * il2 - r2;
        if (Math.sign(yy) * a2 * y2 < k) return sqrt(x2 + y2) * il2 - r1;
        return (sqrt(x2 * a2 * il2) + yy * rr) * il2 - r1;
      };
    }

    var neck = roundCone(0, 0.32, 0, 0, -0.16, 0, 0.5, 0.41);
    var rootL = roundCone(-0.2, -0.02, 0.03, -0.33, -1.14, 0.08, 0.27, 0.075);
    var rootR = roundCone(0.2, -0.02, -0.03, 0.3, -1.1, -0.05, 0.27, 0.075);

    return function (x, y, z) {
      var d = ellipsoid(x, y - 0.44, z, 0.68, 0.45, 0.6);
      d = smin(d, sphere(x - 0.27, y - 0.71, z - 0.23, 0.26), 0.2);
      d = smin(d, sphere(x + 0.28, y - 0.74, z - 0.21, 0.27), 0.2);
      d = smin(d, sphere(x - 0.26, y - 0.69, z + 0.25, 0.25), 0.2);
      d = smin(d, sphere(x + 0.27, y - 0.72, z + 0.23, 0.26), 0.2);
      d = smin(d, neck(x, y, z), 0.24);
      d = smin(d, rootL(x, y, z), 0.26);
      d = smin(d, rootR(x, y, z), 0.26);
      // sulcos oclusais
      d = smax(d, -ellipsoid(x, y - 1.03, z, 0.09, 0.17, 0.44), 0.12);
      d = smax(d, -ellipsoid(x, y - 1.03, z, 0.44, 0.17, 0.09), 0.12);
      return d;
    };
  }

  /* ---------- Surface nets (assíncrono, sem travar a página) ------------- */
  async function buildGeometryData(h) {
    var sdf = makeToothSDF();
    var bmin = [-0.95, -1.36, -0.85], bmax = [0.95, 1.16, 0.85];
    var nx = Math.ceil((bmax[0] - bmin[0]) / h) + 1;
    var ny = Math.ceil((bmax[1] - bmin[1]) / h) + 1;
    var nz = Math.ceil((bmax[2] - bmin[2]) / h) + 1;
    var field = new Float32Array(nx * ny * nz);
    var t0 = performance.now();
    var budget = 9;
    var i, j, k;

    for (k = 0; k < nz; k++) {
      var z = bmin[2] + k * h;
      for (j = 0; j < ny; j++) {
        var y = bmin[1] + j * h, row = (k * ny + j) * nx;
        for (i = 0; i < nx; i++) field[row + i] = sdf(bmin[0] + i * h, y, z);
      }
      if (performance.now() - t0 > budget) { await nextFrame(); t0 = performance.now(); }
    }

    var cx = nx - 1, cy = ny - 1, cz = nz - 1;
    var cellVert = new Int32Array(cx * cy * cz).fill(-1);
    var pos = [];
    var OFF = [0, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1];
    var EDGES = [0, 1, 2, 3, 4, 5, 6, 7, 0, 2, 1, 3, 4, 6, 5, 7, 0, 4, 1, 5, 2, 6, 3, 7];
    var v = new Float32Array(8);
    var vc = 0;

    for (k = 0; k < cz; k++) {
      for (j = 0; j < cy; j++) {
        for (i = 0; i < cx; i++) {
          var inside = 0;
          for (var c = 0; c < 8; c++) {
            var val = field[(i + OFF[c * 3]) + nx * ((j + OFF[c * 3 + 1]) + ny * (k + OFF[c * 3 + 2]))];
            v[c] = val;
            if (val < 0) inside++;
          }
          if (inside === 0 || inside === 8) continue;
          var sx = 0, sy = 0, sz = 0, n = 0;
          for (var e = 0; e < 12; e++) {
            var a = EDGES[e * 2], b = EDGES[e * 2 + 1];
            if ((v[a] < 0) === (v[b] < 0)) continue;
            var t = v[a] / (v[a] - v[b]);
            sx += OFF[a * 3] + t * (OFF[b * 3] - OFF[a * 3]);
            sy += OFF[a * 3 + 1] + t * (OFF[b * 3 + 1] - OFF[a * 3 + 1]);
            sz += OFF[a * 3 + 2] + t * (OFF[b * 3 + 2] - OFF[a * 3 + 2]);
            n++;
          }
          pos.push(bmin[0] + (i + sx / n) * h, bmin[1] + (j + sy / n) * h, bmin[2] + (k + sz / n) * h);
          cellVert[i + cx * (j + cy * k)] = vc++;
        }
      }
      if (performance.now() - t0 > budget) { await nextFrame(); t0 = performance.now(); }
    }

    // Orientação topológica: a ordem dos 4 cubos ao redor de cada aresta é
    // anti-horária quando vista do lado de fora (normal apontando para fora).
    var idx = [];
    var cell = function (ci, cj, ck) { return cellVert[ci + cx * (cj + cy * ck)]; };
    function quad(qa, qb, qc, qd, ccw) {
      if (qa < 0 || qb < 0 || qc < 0 || qd < 0) return;
      if (ccw) idx.push(qa, qb, qc, qa, qc, qd);
      else idx.push(qa, qc, qb, qa, qd, qc);
    }
    for (k = 0; k < nz; k++) {
      for (j = 0; j < ny; j++) {
        for (i = 0; i < nx; i++) {
          var in0 = field[i + nx * (j + ny * k)] < 0;
          if (i < cx && j >= 1 && j < cy && k >= 1 && k < cz && (field[(i + 1) + nx * (j + ny * k)] < 0) !== in0) {
            quad(cell(i, j - 1, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i, j - 1, k), in0);
          }
          if (j < cy && i >= 1 && i < cx && k >= 1 && k < cz && (field[i + nx * ((j + 1) + ny * k)] < 0) !== in0) {
            quad(cell(i - 1, j, k - 1), cell(i, j, k - 1), cell(i, j, k), cell(i - 1, j, k), !in0);
          }
          if (k < cz && i >= 1 && i < cx && j >= 1 && j < cy && (field[i + nx * (j + ny * (k + 1))] < 0) !== in0) {
            quad(cell(i - 1, j - 1, k), cell(i, j - 1, k), cell(i, j, k), cell(i - 1, j, k), in0);
          }
        }
      }
    }

    // Projeta os vértices na superfície exata e calcula normais pelo gradiente.
    var P = new Float32Array(pos);
    var N = new Float32Array(pos.length);
    var eps = h * 0.5;
    var minY = Infinity, maxY = -Infinity, minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
    for (var q = 0; q < vc; q++) {
      var x = P[q * 3], yy = P[q * 3 + 1], zz = P[q * 3 + 2];
      var gx, gy, gz, g2;
      for (var it = 0; it < 2; it++) {
        var d = sdf(x, yy, zz);
        gx = sdf(x + eps, yy, zz) - sdf(x - eps, yy, zz);
        gy = sdf(x, yy + eps, zz) - sdf(x, yy - eps, zz);
        gz = sdf(x, yy, zz + eps) - sdf(x, yy, zz - eps);
        g2 = gx * gx + gy * gy + gz * gz;
        if (g2 < 1e-14) break;
        var f = (d * 2 * eps) / g2;
        var stepLen = Math.sqrt(g2) * Math.abs(f);
        if (stepLen > h * 0.5) f *= (h * 0.5) / stepLen;
        x -= gx * f; yy -= gy * f; zz -= gz * f;
      }
      gx = sdf(x + eps, yy, zz) - sdf(x - eps, yy, zz);
      gy = sdf(x, yy + eps, zz) - sdf(x, yy - eps, zz);
      gz = sdf(x, yy, zz + eps) - sdf(x, yy, zz - eps);
      var gl = Math.sqrt(gx * gx + gy * gy + gz * gz) || 1;
      P[q * 3] = x; P[q * 3 + 1] = yy; P[q * 3 + 2] = zz;
      N[q * 3] = gx / gl; N[q * 3 + 1] = gy / gl; N[q * 3 + 2] = gz / gl;
      if (yy < minY) minY = yy; if (yy > maxY) maxY = yy;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (zz < minZ) minZ = zz; if (zz > maxZ) maxZ = zz;
      if ((q & 1023) === 0 && performance.now() - t0 > budget) { await nextFrame(); t0 = performance.now(); }
    }

    // Centraliza e normaliza a altura (≈ 2.3 unidades).
    var scale = 2.3 / (maxY - minY);
    var ox = (minX + maxX) / 2, oy = (minY + maxY) / 2, oz = (minZ + maxZ) / 2;
    for (q = 0; q < vc; q++) {
      P[q * 3] = (P[q * 3] - ox) * scale;
      P[q * 3 + 1] = (P[q * 3 + 1] - oy) * scale;
      P[q * 3 + 2] = (P[q * 3 + 2] - oz) * scale;
    }

    return { positions: P, normals: N, indices: new Uint32Array(idx) };
  }

  var geometryPromise = null;
  var isSmall = function () { return window.matchMedia('(max-width: 1023px)').matches; };
  function prepare() {
    if (!geometryPromise) geometryPromise = buildGeometryData(isSmall() ? 0.034 : 0.026);
    return geometryPromise;
  }

  function webglAvailable() {
    try {
      var c = document.createElement('canvas');
      return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) {
      return false;
    }
  }

  /* ---------- Cena -------------------------------------------------------- */
  async function mount(stage, opts) {
    opts = opts || {};
    if (!stage) return null;
    if (!webglAvailable()) { stage.classList.add('is-fallback'); return null; }

    var THREE, RoomEnvironment;
    try {
      THREE = await import('three');
      RoomEnvironment = (await import('three/addons/environments/RoomEnvironment.js')).RoomEnvironment;
    } catch (err) {
      console.warn('[Face Clinic] Three.js indisponível, usando ilustração estática.', err);
      stage.classList.add('is-fallback');
      return null;
    }

    var data = await prepare();
    var reduce = !!opts.reduceMotion;
    var small = isSmall();

    var renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    } catch (err) {
      stage.classList.add('is-fallback');
      return null;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.96;
    renderer.setClearColor(0x000000, 0);
    renderer.domElement.setAttribute('aria-hidden', 'true');
    stage.appendChild(renderer.domElement);

    var scene = new THREE.Scene();
    var pmrem = new THREE.PMREMGenerator(renderer);
    var envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;

    var camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    camera.position.set(0, 0.1, 6.9);

    // Iluminação de estúdio
    var key = new THREE.DirectionalLight('#fff1dc', 2.1);
    key.position.set(3.5, 4, 5);
    var rim = new THREE.DirectionalLight('#8fd0da', 1.6);
    rim.position.set(-4, 2.2, -4);
    var under = new THREE.DirectionalLight('#d6bb8a', 0.35);
    under.position.set(0.5, -4, 2.5);
    scene.add(key, rim, under);

    // Dente em porcelana
    var geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(data.positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(data.normals, 3));
    geo.setIndex(new THREE.BufferAttribute(data.indices, 1));
    geo.computeBoundingSphere();

    var porcelain = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#ece5d7'),
      roughness: 0.34,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.12,
      sheen: 0.5,
      sheenRoughness: 0.5,
      sheenColor: new THREE.Color('#e3cda2'),
      specularIntensity: 0.9,
      envMapIntensity: 0.62,
    });
    var tooth = new THREE.Mesh(geo, porcelain);

    // Anéis dourados em órbita (eco dos anéis do logotipo)
    var gold = new THREE.MeshStandardMaterial({ color: new THREE.Color('#d2b072'), metalness: 1, roughness: 0.24, envMapIntensity: 1.3 });
    var ringGeo1 = new THREE.TorusGeometry(1.48, 0.0085, 16, 320);
    var ringGeo2 = new THREE.TorusGeometry(1.66, 0.0045, 12, 320);
    var beadGeo = new THREE.SphereGeometry(0.048, 32, 16);
    var ring1 = new THREE.Mesh(ringGeo1, gold);
    var ring2 = new THREE.Mesh(ringGeo2, gold);
    var bead = new THREE.Mesh(beadGeo, gold);
    ring1.rotation.set(Math.PI / 2 - 0.34, 0.16, 0);
    ring2.rotation.set(Math.PI / 2 + 0.4, -0.28, 0.2);
    ring1.add(bead);
    var rings = new THREE.Group();
    rings.add(ring1, ring2);

    var spinner = new THREE.Group();
    spinner.add(tooth);
    var pivot = new THREE.Group();
    pivot.add(spinner, rings);
    scene.add(pivot);

    var state = {
      progress: 0, spin: 0, focus: 0, focusTarget: 0,
      px: 0, py: 0, tx: 0, ty: 0, bump: 0, intro: 0,
      dragX: 0, dragY: 0,
    };
    var canvas = renderer.domElement;
    var drag = null;
    var running = false, disposed = false;
    var clock = new THREE.Clock();

    function resize() {
      var w = stage.clientWidth, hgt = stage.clientHeight;
      if (!w || !hgt) return;
      renderer.setSize(w, hgt, false);
      camera.aspect = w / hgt;
      camera.updateProjectionMatrix();
      if (!running) draw(0);
    }

    function damp(current, target, base, dt) { return current + (target - current) * (1 - Math.pow(base, dt)); }

    function draw(dt) {
      var t = clock.elapsedTime;
      if (!reduce && !drag) state.spin += dt * 0.14;
      state.intro = reduce ? 1 : damp(state.intro, 1, 0.03, dt);
      state.focus = damp(state.focus, state.focusTarget, 0.02, dt);
      state.px = damp(state.px, state.tx, 0.03, dt);
      state.py = damp(state.py, state.ty, 0.03, dt);
      state.bump *= Math.pow(0.04, dt);

      spinner.rotation.y = -0.5 + state.spin + state.focus + state.progress * Math.PI * 1.1 + state.dragY;
      spinner.rotation.z = reduce ? 0 : Math.sin(t * 0.45) * 0.04;
      var s = (0.86 + 0.14 * state.intro) * (1 + state.bump * 0.04);
      spinner.scale.setScalar(s);

      pivot.rotation.x = 0.14 + state.py * 0.16 + (state.progress - 0.5) * 0.32 + state.dragX;
      pivot.rotation.y = state.px * 0.24;
      pivot.position.y = reduce ? 0 : Math.sin(t * 0.8) * 0.05;

      rings.rotation.y = reduce ? 0.3 : t * 0.1 + state.focus * 0.3;
      ring2.rotation.z = 0.2 + (reduce ? 0 : t * 0.05);
      var ang = reduce ? 0.8 : t * 0.55;
      bead.position.set(Math.cos(ang) * 1.48, Math.sin(ang) * 1.48, 0);

      renderer.render(scene, camera);
    }

    function frame() {
      var dt = Math.min(clock.getDelta(), 0.05);
      draw(dt);
    }

    function setRunning(v) {
      if (disposed || reduce) { if (!disposed) draw(0); return; }
      if (v === running) return;
      running = v;
      if (v) clock.getDelta();
      renderer.setAnimationLoop(v ? frame : null);
    }

    var inView = false;
    var io = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      setRunning(inView && !document.hidden);
    }, { rootMargin: '120px 0px' });
    io.observe(stage);
    var onVis = function () { setRunning(inView && !document.hidden); };
    document.addEventListener('visibilitychange', onVis);

    var ro = new ResizeObserver(resize);
    ro.observe(stage);
    resize();

    function startDrag(e) {
      if (drag || !e.isPrimary || e.button !== 0 || !stage.classList.contains('is-ready')) return;
      canvas.setPointerCapture(e.pointerId);
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
      canvas.classList.add('is-dragging');
    }

    function moveDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var radiansPerPixel = Math.PI / Math.max(canvas.clientWidth, 1);
      state.dragY += (e.clientX - drag.x) * radiansPerPixel;
      state.dragX += (e.clientY - drag.y) * radiansPerPixel;
      drag.x = e.clientX;
      drag.y = e.clientY;
      if (!running) draw(0);
    }

    function endDrag(e) {
      if (!drag || e.pointerId !== drag.id) return;
      drag = null;
      canvas.classList.remove('is-dragging');
    }

    canvas.addEventListener('pointerdown', startDrag);
    canvas.addEventListener('pointermove', moveDrag);
    canvas.addEventListener('lostpointercapture', endDrag);

    // Interação discreta com o mouse em toda a seção
    var section = stage.closest('section') || stage;
    var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    var onMove = function (e) {
      if (drag || e.pointerType !== 'mouse') return;
      var r = stage.getBoundingClientRect();
      state.tx = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      state.ty = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    var onLeave = function () { state.tx = 0; state.ty = 0; };
    if (fine && !reduce) {
      section.addEventListener('pointermove', onMove, { passive: true });
      section.addEventListener('pointerleave', onLeave);
    }

    renderer.domElement.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      setRunning(false);
      stage.classList.remove('is-ready');
      stage.classList.add('is-fallback');
    });

    draw(0);
    requestAnimationFrame(function () { stage.classList.add('is-ready'); });

    function dispose() {
      if (disposed) return;
      disposed = true;
      renderer.setAnimationLoop(null);
      io.disconnect();
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      section.removeEventListener('pointermove', onMove);
      section.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', startDrag);
      canvas.removeEventListener('pointermove', moveDrag);
      canvas.removeEventListener('lostpointercapture', endDrag);
      [geo, ringGeo1, ringGeo2, beadGeo].forEach(function (g) { g.dispose(); });
      porcelain.dispose();
      gold.dispose();
      envTex.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    }
    window.addEventListener('pagehide', function (e) { if (!e.persisted) dispose(); });

    return {
      focus: function (i, instant) {
        state.focusTarget = i * 0.62;
        if (instant) state.focus = state.focusTarget;
        else state.bump = 1;
        if (reduce) draw(0);
      },
      setProgress: function (p) {
        state.progress = p;
        if (reduce) draw(0);
      },
      dispose: dispose,
    };
  }

  window.ToothScene = { prepare: prepare, mount: mount };
})();

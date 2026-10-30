const nexusStage = document.getElementById("nexusStage");
const nexusCanvas = document.getElementById("nexusCanvas");
const nexusCards = [...document.querySelectorAll(".project-card[data-project-index]")];
const nexusDetail = document.getElementById("projectDetail");

if (nexusStage && nexusCanvas && nexusCards.length && typeof HTMLDialogElement !== "undefined" && nexusDetail instanceof HTMLDialogElement) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const projectData = nexusCards.map((card, index) => ({
    card,
    title: card.querySelector(".project-title")?.textContent.trim() || `Projet ${index + 1}`,
    description: card.querySelector(".project-description")?.textContent.trim() || "",
    image: card.querySelector(".project-image img"),
    tags: [...card.querySelectorAll(".project-tags .tag")].map((tag) => tag.textContent.trim()),
    contactLink: card.querySelector(".project-link")?.getAttribute("href") || "#contact",
  }));
  const detailTitle = document.getElementById("nexusDetailTitle");
  const detailDescription = document.getElementById("nexusDetailDescription");
  const detailImage = document.getElementById("nexusDetailImage");
  const detailTags = document.getElementById("nexusDetailTags");
  const detailProgress = document.getElementById("nexusDetailProgress");
  const detailIndex = document.getElementById("nexusDetailIndex");
  const detailContact = document.getElementById("nexusDetailContact");
  const detailClose = document.getElementById("nexusDetailClose");
  const detailPrevious = document.getElementById("nexusDetailPrevious");
  const detailNext = document.getElementById("nexusDetailNext");
  const projectCount = projectData.length;
  const stageCounter = document.getElementById("nexusStageCounter");
  const lowPower =
    navigator.hardwareConcurrency < 4 ||
    navigator.connection?.saveData === true ||
    window.matchMedia("(max-width: 700px)").matches;
  const pointer = { x: 0, y: 0, active: false };
  let selectedIndex = -1;
  let previousFocus = null;
  let restoreScroll = 0;
  let afterProjectClose = null;
  let scene = null;
  let sceneObserver = null;
  let closeTimer;
  const projectGravity = { x: 0, y: 0, active: false };

  function updateProjectGravity() {
    nexusCards.forEach((card, index) => {
      const orbitPosition = (index - (projectCount - 1) / 2) * 0.72;
      const distance = Math.hypot(projectGravity.x - orbitPosition, projectGravity.y);
      const attraction = projectGravity.active ? Math.max(0, 1 - distance * 0.9) : 0;
      const wake = projectGravity.active ? Math.min(1, distance * 0.35) : 0;
      card.style.setProperty("--gravity-x", `${(projectGravity.x - orbitPosition) * attraction * 7 - Math.sign(orbitPosition - projectGravity.x) * wake * 1.7}px`);
      card.style.setProperty("--gravity-y", `${projectGravity.y * attraction * -5}px`);
      card.style.setProperty("--gravity-z", `${attraction * 13}px`);
    });
  }

  if (stageCounter) {
    stageCounter.textContent = `${String(projectCount).padStart(2, "0")} MODULES`;
  }

  function showProject(index) {
    selectedIndex = (index + projectCount) % projectCount;
    const project = projectData[selectedIndex];
    detailTitle.textContent = project.title;
    detailDescription.textContent = project.description;
    detailImage.src = project.image.currentSrc || project.image.src;
    detailImage.alt = project.image.alt;
    detailProgress.textContent = `${String(selectedIndex + 1).padStart(2, "0")} / ${String(projectCount).padStart(2, "0")}`;
    detailIndex.textContent = `${String(selectedIndex + 1).padStart(2, "0")} — SELECTED MODULE`;
    detailContact.href = project.contactLink;
    detailTags.replaceChildren();

    project.tags.forEach((tag) => {
      const badge = document.createElement("span");
      badge.className = "tag";
      badge.textContent = tag;
      detailTags.append(badge);
    });

    nexusCards.forEach((card, cardIndex) => {
      card.classList.toggle("is-selected", cardIndex === selectedIndex);
    });

    if (scene) scene.selected = selectedIndex;
  }

  function openProject(index, trigger) {
    previousFocus = trigger;
    showProject(index);
    restoreScroll = window.scrollY;
    document.body.classList.add("nexus-detail-open");
    nexusDetail.showModal();
    detailClose.focus({ preventScroll: true });
    nexusDetail.classList.remove("is-transitioning-out");
    nexusDetail.classList.add("is-transitioning-in");
  }

  function closeProject() {
    if (!nexusDetail.open) return;
    window.clearTimeout(closeTimer);
    nexusDetail.classList.remove("is-transitioning-in");
    nexusDetail.classList.add("is-transitioning-out");

    closeTimer = window.setTimeout(
      () => {
        if (nexusDetail.open) nexusDetail.close();
      },
      reducedMotion.matches ? 0 : 360,
    );
  }

  nexusCards.forEach((card, index) => {
    const explore = document.createElement("button");
    explore.className = "project-explore";
    explore.type = "button";
    explore.setAttribute("aria-haspopup", "dialog");
    explore.innerHTML = 'Explorer ce projet <i class="bi bi-arrows-angle-expand" aria-hidden="true"></i>';
    card.querySelector(".project-explore")?.replaceWith(explore);
    explore.setAttribute("aria-label", `Découvrir les détails de ${projectData[index].title}`);
    explore.addEventListener("click", () => openProject(index, explore));
  });

  detailClose.addEventListener("click", closeProject);
  detailPrevious.addEventListener("click", () => showProject(selectedIndex - 1));
  detailNext.addEventListener("click", () => showProject(selectedIndex + 1));
  detailContact.addEventListener("click", (event) => {
    event.preventDefault();
    afterProjectClose = () => {
      const contact = document.getElementById("contact");
      if (!contact) return;
      contact.setAttribute("tabindex", "-1");
      contact.focus({ preventScroll: true });
      contact.addEventListener("blur", () => contact.removeAttribute("tabindex"), { once: true });
      contact.scrollIntoView({ behavior: reducedMotion.matches ? "auto" : "smooth", block: "start" });
    };
    closeProject();
  });

  nexusDetail.addEventListener("cancel", (event) => {
    event.preventDefault();
    closeProject();
  });

  nexusDetail.addEventListener("click", (event) => {
    if (event.target === nexusDetail) closeProject();
  });

  nexusDetail.addEventListener("close", () => {
    nexusDetail.classList.remove("is-transitioning-in", "is-transitioning-out");
    document.body.classList.remove("nexus-detail-open");
    nexusCards.forEach((card) => card.classList.remove("is-selected"));
    selectedIndex = -1;
    if (scene) scene.selected = -1;

    if (previousFocus?.isConnected) {
      previousFocus.focus({ preventScroll: true });
    }

    if (afterProjectClose) {
      const action = afterProjectClose;
      afterProjectClose = null;
      action();
    } else {
      window.scrollTo({ top: restoreScroll, behavior: "auto" });
    }
  });

  nexusDetail.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      closeProject();
      return;
    }

    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    showProject(selectedIndex + (event.key === "ArrowRight" ? 1 : -1));
  });

  nexusStage.addEventListener("pointermove", (event) => {
    const bounds = nexusStage.getBoundingClientRect();
    pointer.x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 2;
    pointer.y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 2;
    pointer.active = true;
    nexusStage.style.setProperty("--nexus-pointer-x", `${event.clientX - bounds.left}px`);
    nexusStage.style.setProperty("--nexus-pointer-y", `${event.clientY - bounds.top}px`);
    projectGravity.x = pointer.x;
    projectGravity.y = pointer.y;
    projectGravity.active = true;
    updateProjectGravity();
  }, { passive: true });

  nexusStage.addEventListener("pointerleave", () => {
    pointer.active = false;
    projectGravity.active = false;
    updateProjectGravity();
  }, { passive: true });

  nexusCards.forEach((card) => {
    card.addEventListener("pointermove", (event) => {
      const bounds = card.getBoundingClientRect();
      const localX = (event.clientX - bounds.left) / bounds.width;
      const localY = (event.clientY - bounds.top) / bounds.height;
      card.style.setProperty("--card-pointer-x", `${localX * 100}%`);
      card.style.setProperty("--card-pointer-y", `${localY * 100}%`);
      card.style.setProperty("--card-tilt-x", `${(0.5 - localY) * 7}deg`);
      card.style.setProperty("--card-tilt-y", `${(localX - 0.5) * 8}deg`);
      const containerBounds = document.querySelector(".projects-container").getBoundingClientRect();
      projectGravity.x = ((event.clientX - containerBounds.left) / containerBounds.width - 0.5) * 2;
      projectGravity.y = ((event.clientY - containerBounds.top) / containerBounds.height - 0.5) * 2;
      projectGravity.active = true;
      updateProjectGravity();
    }, { passive: true });

    card.addEventListener("pointerleave", () => {
      card.style.setProperty("--card-tilt-x", "0deg");
      card.style.setProperty("--card-tilt-y", "0deg");
      projectGravity.active = false;
      updateProjectGravity();
    }, { passive: true });
  });

  function createProjectScene() {
    const gl = nexusCanvas.getContext("webgl", {
      alpha: true,
      antialias: !lowPower,
      depth: true,
      powerPreference: lowPower ? "low-power" : "default",
      premultipliedAlpha: true,
    });

    if (!gl) {
      console.warn("WebGL n'est pas disponible ; les projets restent accessibles en version classique.");
      nexusStage.classList.add("nexus-fallback");
      return null;
    }

    const vertexSource = `
      attribute vec3 a_position;
      attribute vec2 a_uv;
      attribute vec3 a_normal;
      uniform mat4 u_mvp;
      uniform mat4 u_model;
      uniform float u_point_size;
      varying vec2 v_uv;
      varying vec3 v_normal;
      varying vec3 v_position;
      void main() {
        vec4 world = u_model * vec4(a_position, 1.0);
        gl_Position = u_mvp * vec4(a_position, 1.0);
        gl_PointSize = u_point_size;
        v_uv = a_uv;
        v_normal = normalize(mat3(u_model) * a_normal);
        v_position = world.xyz;
      }
    `;
    const fragmentSource = `
      precision mediump float;
      uniform sampler2D u_texture;
      uniform vec3 u_color;
      uniform float u_time;
      uniform float u_hover;
      uniform float u_opacity;
      uniform float u_material;
      uniform float u_has_texture;
      varying vec2 v_uv;
      varying vec3 v_normal;
      varying vec3 v_position;
      void main() {
        if (u_material > 2.5) {
          vec2 point = gl_PointCoord - vec2(0.5);
          float glow = 1.0 - smoothstep(0.05, 0.5, length(point));
          gl_FragColor = vec4(u_color, glow * u_opacity);
          return;
        }
        float edge = min(min(v_uv.x, 1.0 - v_uv.x), min(v_uv.y, 1.0 - v_uv.y));
        float border = 1.0 - smoothstep(0.0, 0.014, edge);
        float light = 0.52 + 0.48 * max(0.0, dot(normalize(v_normal), normalize(vec3(-0.4, 0.7, 1.0))));
        vec3 glow = u_color * (0.25 + 0.75 * light + u_hover * 0.65);
        float shimmer = 0.5 + 0.5 * sin(u_time * 0.7 + v_uv.x * 11.0 + v_uv.y * 7.0);
        if (u_material > 1.5) {
          float fresnel = pow(1.0 - abs(dot(normalize(v_normal), vec3(0.0, 0.0, 1.0))), 1.6);
          vec3 orb = mix(vec3(0.01, 0.11, 0.27), vec3(0.0, 0.83, 1.0), fresnel + u_hover * 0.22);
          float core = 1.0 - smoothstep(0.08, 0.72, length(v_position.xy));
          gl_FragColor = vec4(orb + vec3(0.06, 0.18, 0.3) * core, u_opacity);
          return;
        }
        vec4 image = mix(vec4(0.035, 0.07, 0.14, 1.0), texture2D(u_texture, v_uv), u_has_texture);
        vec3 imageColor = image.rgb * (0.82 + 0.18 * light);
        imageColor += u_color * shimmer * u_hover * 0.18;
        imageColor = mix(imageColor, glow + vec3(0.08, 0.2, 0.28), border * (0.74 + u_hover * 0.5));
        gl_FragColor = vec4(imageColor, image.a * u_opacity);
      }
    `;

    function compileShader(type, source) {
      const shader = gl.createShader(type);
      if (!shader) throw new Error("Impossible de créer un shader WebGL.");
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(`Compilation du shader WebGL impossible : ${message}`);
      }
      return shader;
    }

    let program;
    try {
      const vertexShader = compileShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = compileShader(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      if (!program) throw new Error("Impossible de créer le programme WebGL.");
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        throw new Error(`Liaison du programme WebGL impossible : ${gl.getProgramInfoLog(program)}`);
      }
    } catch (error) {
      console.error("La scène Nexus 3D n'a pas pu être initialisée.", error);
      nexusStage.classList.add("nexus-fallback");
      return null;
    }

    const locations = {
      position: gl.getAttribLocation(program, "a_position"),
      uv: gl.getAttribLocation(program, "a_uv"),
      normal: gl.getAttribLocation(program, "a_normal"),
      mvp: gl.getUniformLocation(program, "u_mvp"),
      model: gl.getUniformLocation(program, "u_model"),
      texture: gl.getUniformLocation(program, "u_texture"),
      color: gl.getUniformLocation(program, "u_color"),
      time: gl.getUniformLocation(program, "u_time"),
      hover: gl.getUniformLocation(program, "u_hover"),
      opacity: gl.getUniformLocation(program, "u_opacity"),
      material: gl.getUniformLocation(program, "u_material"),
      hasTexture: gl.getUniformLocation(program, "u_has_texture"),
      pointSize: gl.getUniformLocation(program, "u_point_size"),
    };

    function createBuffer(data, size) {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error("Impossible d'allouer une géométrie WebGL.");
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
      return { buffer, size, count: data.length / size };
    }

    function createMesh(positions, uvs, normals) {
      return {
        positions: createBuffer(positions, 3),
        uvs: uvs.length ? createBuffer(uvs, 2) : null,
        normals: normals.length ? createBuffer(normals, 3) : null,
        count: positions.length / 3,
      };
    }

    const planePositions = [
      -1.02, -0.65, 0, 1.02, -0.65, 0, 1.02, 0.65, 0,
      -1.02, -0.65, 0, 1.02, 0.65, 0, -1.02, 0.65, 0,
    ];
    const planeUvs = [0, 0, 1, 0, 1, 1, 0, 0, 1, 1, 0, 1];
    const planeNormals = Array.from({ length: 6 }, () => [0, 0, 1]).flat();
    const plane = createMesh(planePositions, planeUvs, planeNormals);
    const backPlate = createMesh(
      [-1.09, -0.7, 0, 1.09, -0.7, 0, 1.09, 0.7, 0, -1.09, -0.7, 0, 1.09, 0.7, 0, -1.09, 0.7, 0],
      planeUvs,
      planeNormals,
    );

    function createSphere(rows, columns) {
      const positions = [];
      const uvs = [];
      const normals = [];

      for (let row = 0; row < rows; row += 1) {
        const v0 = row / rows;
        const v1 = (row + 1) / rows;
        const phi0 = v0 * Math.PI;
        const phi1 = v1 * Math.PI;

        for (let column = 0; column < columns; column += 1) {
          const u0 = column / columns;
          const u1 = (column + 1) / columns;
          const theta0 = u0 * Math.PI * 2;
          const theta1 = u1 * Math.PI * 2;
          const point = (phi, theta) => [
            Math.sin(phi) * Math.cos(theta),
            Math.cos(phi),
            Math.sin(phi) * Math.sin(theta),
          ];
          const vertices = [
            [point(phi0, theta0), u0, v0],
            [point(phi1, theta0), u0, v1],
            [point(phi1, theta1), u1, v1],
            [point(phi0, theta0), u0, v0],
            [point(phi1, theta1), u1, v1],
            [point(phi0, theta1), u1, v0],
          ];

          vertices.forEach(([normal, u, v]) => {
            positions.push(...normal);
            normals.push(...normal);
            uvs.push(u, v);
          });
        }
      }

      return createMesh(positions, uvs, normals);
    }

    function createTorus(majorSegments, tubeSegments) {
      const positions = [];
      const normals = [];

      for (let major = 0; major < majorSegments; major += 1) {
        const a0 = major / majorSegments * Math.PI * 2;
        const a1 = (major + 1) / majorSegments * Math.PI * 2;

        for (let tube = 0; tube < tubeSegments; tube += 1) {
          const b0 = tube / tubeSegments * Math.PI * 2;
          const b1 = (tube + 1) / tubeSegments * Math.PI * 2;
          const point = (a, b) => {
            const ring = 1 + Math.cos(b) * 0.012;
            return [Math.cos(a) * ring, Math.sin(a) * ring, Math.sin(b) * 0.012];
          };
          const normal = (a, b) => [Math.cos(a) * Math.cos(b), Math.sin(a) * Math.cos(b), Math.sin(b)];
          const vertices = [[a0, b0], [a1, b0], [a1, b1], [a0, b0], [a1, b1], [a0, b1]];
          vertices.forEach(([a, b]) => {
            positions.push(...point(a, b));
            normals.push(...normal(a, b));
          });
        }
      }

      return createMesh(positions, [], normals);
    }

    const sphere = createSphere(16, 24);
    const torus = createTorus(52, 7);
    const meshes = [plane, backPlate, sphere, torus];
    const textures = projectData.map(() => {
      const texture = gl.createTexture();
      if (!texture) throw new Error("Impossible d'allouer une texture WebGL.");
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([9, 24, 43, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return { texture, ready: false };
    });
    const particleCount = lowPower ? 34 : 86;
    const particlePositions = [];
    for (let index = 0; index < particleCount; index += 1) {
      const angle = index * 2.399963;
      const radius = 1.1 + ((index * 37) % 100) / 100 * 1.75;
      particlePositions.push(Math.cos(angle) * radius, (Math.sin(angle * 2.37) * 0.8), Math.sin(angle) * radius);
    }
    const particles = createMesh(particlePositions, [], Array(particleCount * 3).fill(0));
    meshes.push(particles);

    function identity() {
      return new Float32Array([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]);
    }

    function multiply(a, b) {
      const output = new Float32Array(16);
      for (let column = 0; column < 4; column += 1) {
        for (let row = 0; row < 4; row += 1) {
          output[column * 4 + row] =
            a[row] * b[column * 4] +
            a[4 + row] * b[column * 4 + 1] +
            a[8 + row] * b[column * 4 + 2] +
            a[12 + row] * b[column * 4 + 3];
        }
      }
      return output;
    }

    function translation(x, y, z) {
      const matrix = identity();
      matrix[12] = x;
      matrix[13] = y;
      matrix[14] = z;
      return matrix;
    }

    function rotationX(angle) {
      const matrix = identity();
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      matrix[5] = cosine;
      matrix[6] = sine;
      matrix[9] = -sine;
      matrix[10] = cosine;
      return matrix;
    }

    function rotationY(angle) {
      const matrix = identity();
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      matrix[0] = cosine;
      matrix[2] = -sine;
      matrix[8] = sine;
      matrix[10] = cosine;
      return matrix;
    }

    function rotationZ(angle) {
      const matrix = identity();
      const cosine = Math.cos(angle);
      const sine = Math.sin(angle);
      matrix[0] = cosine;
      matrix[1] = sine;
      matrix[4] = -sine;
      matrix[5] = cosine;
      return matrix;
    }

    function scaling(x, y, z) {
      const matrix = identity();
      matrix[0] = x;
      matrix[5] = y;
      matrix[10] = z;
      return matrix;
    }

    function perspective(fov, aspect, near, far) {
      const factor = 1 / Math.tan(fov / 2);
      const range = 1 / (near - far);
      const matrix = new Float32Array(16);
      matrix[0] = factor / aspect;
      matrix[5] = factor;
      matrix[10] = (near + far) * range;
      matrix[11] = -1;
      matrix[14] = near * far * 2 * range;
      return matrix;
    }

    function uploadImage(index) {
      const image = projectData[index].image;
      if (!image.complete || !image.naturalWidth || image.src.startsWith("data:")) return;

      try {
        const imageUrl = new URL(image.currentSrc || image.src, location.href);
        if (imageUrl.origin !== location.origin && image.crossOrigin !== "anonymous") return;
        gl.bindTexture(gl.TEXTURE_2D, textures[index].texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
        textures[index].ready = true;
      } catch (error) {
        console.warn(`Aperçu WebGL indisponible pour « ${projectData[index].title} ».`, error);
      }
    }

    projectData.forEach(({ image }, index) => {
      if (image.complete && image.naturalWidth) {
        uploadImage(index);
      } else {
        image.addEventListener("load", () => uploadImage(index), { once: true });
      }
    });

    function bindMesh(mesh) {
      gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positions.buffer);
      gl.enableVertexAttribArray(locations.position);
      gl.vertexAttribPointer(locations.position, 3, gl.FLOAT, false, 0, 0);

      if (mesh.uvs) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.uvs.buffer);
        gl.enableVertexAttribArray(locations.uv);
        gl.vertexAttribPointer(locations.uv, 2, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(locations.uv);
        gl.vertexAttrib2f(locations.uv, 0, 0);
      }

      if (mesh.normals) {
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normals.buffer);
        gl.enableVertexAttribArray(locations.normal);
        gl.vertexAttribPointer(locations.normal, 3, gl.FLOAT, false, 0, 0);
      } else {
        gl.disableVertexAttribArray(locations.normal);
        gl.vertexAttrib3f(locations.normal, 0, 0, 1);
      }
    }

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = false;
    let inViewport = false;
    let disposed = false;
    let selectionStartedAt = 0;
    const startTime = performance.now();

    function resize() {
      const bounds = nexusStage.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, lowPower ? 1 : 1.35);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      nexusCanvas.width = Math.round(width * ratio);
      nexusCanvas.height = Math.round(height * ratio);
      gl.viewport(0, 0, nexusCanvas.width, nexusCanvas.height);
      if (visible) {
        window.cancelAnimationFrame(frame);
        frame = window.requestAnimationFrame(draw);
      } else {
        draw(performance.now());
      }
    }

    function draw(now) {
      if (disposed || gl.isContextLost()) return;
      const seconds = reducedMotion.matches ? 0 : (now - startTime) * 0.001;
      const aspect = width / Math.max(1, height);
      const projection = perspective(0.67, aspect, 0.1, 80);
      const cameraX = reducedMotion.matches ? 0 : pointer.x * 0.22;
      const cameraY = reducedMotion.matches ? 0 : -pointer.y * 0.12;
      const view = translation(-cameraX, -cameraY, -6.1);
      const viewProjection = multiply(projection, view);
      const compact = width < 620;
      const spreading = selectedIndex >= 0;

      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      gl.enable(gl.DEPTH_TEST);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      gl.useProgram(program);
      gl.uniform1f(locations.time, seconds);
      gl.uniform1i(locations.texture, 0);
      gl.uniform1f(locations.pointSize, lowPower ? 2 : 2.8);

      projectData.forEach((project, index) => {
        const offset = index - (projectCount - 1) / 2;
        const baseX = compact ? 0 : offset * 2.16;
        const baseY = compact ? -offset * 1.1 : Math.sin(index * 2.1) * 0.19;
        const baseZ = -Math.abs(offset) * 0.18;
        const proximity = pointer.active && !reducedMotion.matches
          ? Math.max(0, 1 - Math.hypot(pointer.x * 1.35 - offset * 0.7, pointer.y * 0.9 - baseY) * 0.55)
          : 0;
        const active = selectedIndex === index;
        const away = spreading && !active ? 1 : 0;
        const selectionProgress = active
          ? Math.min(1, Math.max(0, (now - selectionStartedAt) / 1250))
          : 0;
        const selectionEase = 1 - (1 - selectionProgress) ** 3;
        const float = reducedMotion.matches ? 0 : Math.sin(seconds * 0.82 + index * 1.8) * 0.13;
        const x = baseX + (pointer.active && !compact ? (pointer.x * 0.22) / (Math.abs(offset) + 1) : 0) + (away ? Math.sign(offset || (index - selectedIndex)) * 0.42 : 0);
        const y = baseY + float - pointer.y * proximity * 0.12 + (away ? (index % 2 ? 0.2 : -0.18) : 0);
        const z = baseZ + proximity * 0.19 + (active ? 0.85 : away ? -0.5 : 0);
        const yaw = (reducedMotion.matches ? 0 : Math.sin(seconds * 0.35 + index * 1.3) * 0.07) - pointer.x * proximity * 0.1 + selectionEase * Math.PI * 2;
        let model = multiply(translation(x, y, z), rotationY(yaw));
        model = multiply(model, rotationX(-pointer.y * proximity * 0.045));
        const scale = active ? 1.42 : away ? 0.82 : 1;
        model = multiply(model, scaling(scale, scale, 1));

        gl.uniformMatrix4fv(locations.model, false, model);
        gl.uniformMatrix4fv(locations.mvp, false, multiply(viewProjection, model));
        gl.uniform3f(locations.color, 0.02, 0.72 + proximity * 0.24, 1);
        gl.uniform1f(locations.hover, proximity + (active ? 0.52 : 0));
        gl.uniform1f(locations.opacity, away ? 0.28 : 1);
        gl.uniform1f(locations.material, 0);
        gl.uniform1f(locations.hasTexture, textures[index].ready ? 1 : 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, textures[index].texture);
        bindMesh(plane);
        gl.drawArrays(gl.TRIANGLES, 0, plane.count);

        const back = multiply(model, translation(0, 0, -0.045));
        const backScale = multiply(back, scaling(1.035, 1.045, 1));
        gl.uniformMatrix4fv(locations.model, false, backScale);
        gl.uniformMatrix4fv(locations.mvp, false, multiply(viewProjection, backScale));
        gl.uniform3f(locations.color, 0.02, 0.28, 0.48);
        gl.uniform1f(locations.material, 1);
        gl.uniform1f(locations.hasTexture, 0);
        bindMesh(backPlate);
        gl.drawArrays(gl.TRIANGLES, 0, backPlate.count);
      });

      for (let ring = 0; ring < 3; ring += 1) {
        let model = multiply(
          translation(0, 0, -0.12),
          rotationX((ring === 0 ? 0.28 : 1.12) + (reducedMotion.matches ? 0 : seconds * (ring % 2 ? -0.12 : 0.17))),
        );
        model = multiply(model, rotationY(ring * 0.8 + seconds * (ring === 1 && !reducedMotion.matches ? 0.11 : 0)));
        model = multiply(model, scaling(1 + ring * 0.36, 1 + ring * 0.36, 1));
        gl.uniformMatrix4fv(locations.model, false, model);
        gl.uniformMatrix4fv(locations.mvp, false, multiply(viewProjection, model));
        gl.uniform3f(locations.color, ring === 1 ? 0.04 : 0.01, ring === 1 ? 0.46 : 0.24, 0.75 + ring * 0.07);
        gl.uniform1f(locations.hover, pointer.active ? 0.2 : 0);
        gl.uniform1f(locations.opacity, ring === 2 ? 0.22 : 0.48);
        gl.uniform1f(locations.material, 1);
        gl.uniform1f(locations.hasTexture, 0);
        bindMesh(torus);
        gl.drawArrays(gl.TRIANGLES, 0, torus.count);
      }

      const orbModel = multiply(
        translation(0, 0, -0.58),
        rotationY(seconds * 0.35),
      );
      const orbScale = multiply(orbModel, scaling(0.22, 0.22, 0.22));
      gl.uniformMatrix4fv(locations.model, false, orbScale);
      gl.uniformMatrix4fv(locations.mvp, false, multiply(viewProjection, orbScale));
      gl.uniform3f(locations.color, 0, 0.54, 1);
      gl.uniform1f(locations.hover, pointer.active ? 0.55 : 0.1);
      gl.uniform1f(locations.opacity, 0.94);
      gl.uniform1f(locations.material, 2);
      gl.uniform1f(locations.hasTexture, 0);
      bindMesh(sphere);
      gl.drawArrays(gl.TRIANGLES, 0, sphere.count);

      const particleModel = rotationY(seconds * 0.055);
      gl.uniformMatrix4fv(locations.model, false, particleModel);
      gl.uniformMatrix4fv(locations.mvp, false, multiply(viewProjection, particleModel));
      gl.uniform3f(locations.color, 0.05, 0.7, 1);
      gl.uniform1f(locations.hover, 0);
      gl.uniform1f(locations.opacity, 0.62);
      gl.uniform1f(locations.material, 3);
      gl.uniform1f(locations.hasTexture, 0);
      bindMesh(particles);
      gl.drawArrays(gl.POINTS, 0, particles.count);

      if (!reducedMotion.matches && visible && !document.hidden) {
        frame = window.requestAnimationFrame(draw);
      }
    }

    function halt() {
      visible = false;
      window.cancelAnimationFrame(frame);
    }

    function pause() {
      inViewport = false;
      halt();
    }

    function resume() {
      if (disposed || document.hidden) return;
      inViewport = true;
      visible = true;
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(draw);
    }

    const resizeObserver = "ResizeObserver" in window
      ? new ResizeObserver(resize)
      : null;
    if (resizeObserver) resizeObserver.observe(nexusStage);
    else window.addEventListener("resize", resize);

    nexusCanvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      pause();
      nexusStage.classList.add("nexus-fallback");
      console.warn("Le contexte graphique a été perdu ; les fiches projets restent disponibles.");
    });

    nexusCanvas.addEventListener("webglcontextrestored", () => {
      if (!disposed) window.location.reload();
    });

    const visibilityHandler = () => {
      if (document.hidden) halt();
      else if (inViewport) resume();
    };
    document.addEventListener("visibilitychange", visibilityHandler);

    const motionHandler = () => {
      if (reducedMotion.matches) {
        window.cancelAnimationFrame(frame);
        draw(startTime);
      } else {
        resume();
      }
    };
    if ("addEventListener" in reducedMotion) reducedMotion.addEventListener("change", motionHandler);
    else reducedMotion.addListener(motionHandler);

    function dispose() {
      if (disposed) return;
      disposed = true;
      inViewport = false;
      halt();
      resizeObserver?.disconnect();
      if (!resizeObserver) window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", visibilityHandler);
      if ("removeEventListener" in reducedMotion) reducedMotion.removeEventListener("change", motionHandler);
      else reducedMotion.removeListener(motionHandler);
      meshes.forEach((mesh) => {
        gl.deleteBuffer(mesh.positions.buffer);
        if (mesh.uvs) gl.deleteBuffer(mesh.uvs.buffer);
        if (mesh.normals) gl.deleteBuffer(mesh.normals.buffer);
      });
      textures.forEach(({ texture }) => gl.deleteTexture(texture));
      gl.deleteProgram(program);
    }

    window.addEventListener("pagehide", dispose, { once: true });
    resize();

    return {
      get selected() {
        return selectedIndex;
      },
      set selected(index) {
        selectedIndex = index;
        selectionStartedAt = performance.now();
        if (visible) {
          window.cancelAnimationFrame(frame);
          frame = window.requestAnimationFrame(draw);
        } else {
          draw(performance.now());
        }
      },
      resume,
      pause,
      dispose,
    };
  }

  if ("IntersectionObserver" in window) {
    sceneObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) scene?.pause();
          else {
            if (!scene) scene = createProjectScene();
            scene?.resume();
          }
        });
      },
      { rootMargin: "200px 0px", threshold: 0.01 },
    );
    sceneObserver.observe(nexusStage);
  } else {
    scene = createProjectScene();
    scene?.resume();
  }

  window.addEventListener("pagehide", () => {
    sceneObserver?.disconnect();
    scene?.dispose();
  }, { once: true });
}
  
/**
 * A conceptual electric-motorcycle assembly diagram, inspired by the long,
 * low ICHIBAN silhouette. This is a generic explanatory model, not CAD.
 * In particular the paired central motors are a speculative teaching layout.
 *
 * Coordinates: X longitudinal (front is negative), Y up, Z across the bike.
 * Pass the caller's THREE namespace; no scene, lighting, camera or DOM is made.
 */
export function createMotorcycle(THREE) {
  const root = new THREE.Group();
  root.name = 'Concept electric motorcycle';
  root.userData.description = 'Conceptual assembly; generic central motor layout is speculative.';

  const stages = [];
  const white = 0xf8f8f4;
  const tireWhite = 0xe9e9e3;
  const ink = 0x242523;
  const material = (color = white) => new THREE.MeshStandardMaterial({
    color, roughness: 0.83, metalness: 0.0,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  });
  const lineMaterial = () => new THREE.LineBasicMaterial({
    color: ink, transparent: true, opacity: 0.76,
  });
  const v = (p) => new THREE.Vector3(...p);

  function stage(label, explode) {
    const group = new THREE.Group();
    group.name = label;
    group.userData.label = label;
    group.userData.explode = explode;
    group.userData.stage = stages.length;
    stages.push(group);
    root.add(group);
    return group;
  }

  // Each surface and outline owns its material so callers can fade one stage
  // without inadvertently changing a part in another stage.
  function part(group, geometry, name, position = [0, 0, 0], color = white, edgeAngle = 24) {
    const mesh = new THREE.Mesh(geometry, material(color));
    mesh.name = name;
    mesh.position.set(...position);
    mesh.userData.part = true;
    group.add(mesh);
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, edgeAngle), lineMaterial());
    edges.name = name + ' outline';
    edges.userData.outline = true;
    mesh.add(edges);
    // A narrow back-face contour keeps curved tires, bars and housings legible.
    // EdgesGeometry alone only outlines the end caps of a smooth cylinder.
    const contourMaterial = new THREE.MeshBasicMaterial({color:ink,side:THREE.BackSide});
    contourMaterial.onBeforeCompile = (shader) => {
      shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>', 'vec3 transformed = vec3(position) + normal * 0.0022;');
    };
    const contour = new THREE.Mesh(geometry, contourMaterial);
    contour.name = name + ' silhouette';
    contour.userData.outline = true;
    contour.userData.silhouette = true;
    mesh.add(contour);
    return mesh;
  }

  function box(group, name, size, center, color = white) {
    return part(group, new THREE.BoxGeometry(...size), name, center, color);
  }

  function cylinder(group, name, radius, depth, center, color = white, segments = 48) {
    const mesh = part(group, new THREE.CylinderGeometry(radius, radius, depth, segments, 1, false), name, center, color);
    mesh.rotation.x = Math.PI / 2;
    return mesh;
  }

  function rod(group, name, a, b, radius, color = white, segments = 20) {
    const start = v(a), end = v(b), direction = end.clone().sub(start);
    const mesh = part(group, new THREE.CylinderGeometry(radius, radius, direction.length(), segments), name,
      start.clone().add(end).multiplyScalar(0.5).toArray(), color);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
    return mesh;
  }

  function ring(group, name, x, y, z, radius, opacity = 0.7) {
    const points = [];
    for (let i = 0; i < 96; i++) {
      const theta = (i / 96) * Math.PI * 2;
      points.push(new THREE.Vector3(x + Math.cos(theta) * radius, y + Math.sin(theta) * radius, z));
    }
    const line = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points), lineMaterial());
    line.name = name;
    line.material.opacity = opacity;
    line.userData.outline = true;
    group.add(line);
    return line;
  }

  function roundedRect(x, y, width, height, radius) {
    const s = new THREE.Shape();
    const r = Math.min(radius, width / 2, height / 2);
    s.moveTo(x + r, y);
    s.lineTo(x + width - r, y);
    s.quadraticCurveTo(x + width, y, x + width, y + r);
    s.lineTo(x + width, y + height - r);
    s.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    s.lineTo(x + r, y + height);
    s.quadraticCurveTo(x, y + height, x, y + height - r);
    s.lineTo(x, y + r);
    s.quadraticCurveTo(x, y, x + r, y);
    return s;
  }

  function extrusion(group, name, shape, depth, z = 0, bevel = 0.006, color = white) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: bevel > 0, bevelSegments: 2,
      bevelSize: bevel, bevelThickness: bevel, steps: 1, curveSegments: 8,
    });
    geometry.translate(0, 0, -depth / 2);
    return part(group, geometry, name, [0, 0, z], color, 25);
  }

  function plate(group, name, xy, depth, z = 0, bevel = 0.006) {
    const shape = new THREE.Shape();
    shape.moveTo(...xy[0]);
    for (const p of xy.slice(1)) shape.lineTo(...p);
    shape.closePath();
    return extrusion(group, name, shape, depth, z, bevel);
  }

  function fastener(group, name, x, y, z, radius = 0.013) {
    // Hexagonal bolt heads remain readable at diagram scale.
    return cylinder(group, name, radius, 0.012, [x, y, z], white, 6);
  }

  function wheel(group, name, x) {
    const y = 0.43;
    const tire = part(group, new THREE.TorusGeometry(0.363, 0.067, 16, 72), name + ' tire', [x, y, 0], tireWhite, 35);
    tire.scale.z = 1.49;
    // Almost solid aero discs distinguish the concept's silhouette.
    cylinder(group, name + ' disc wheel', 0.358, 0.172, [x, y, 0]);
    for (const side of [-1, 1]) {
      cylinder(group, name + ' shallow aero face', 0.335, 0.009, [x, y, side * 0.090]);
      cylinder(group, name + ' axle boss', 0.073, 0.019, [x, y, side * 0.102]);
      cylinder(group, name + ' axle cap', 0.036, 0.011, [x, y, side * 0.118]);
      ring(group, name + ' rim seam', x, y, side * 0.098, 0.319, 0.6);
      ring(group, name + ' hub seam', x, y, side * 0.116, 0.056, 0.7);
    }
  }

  // 0 — Structural cradle, slender side rails, steering head and battery tray.
  const chassis = stage('01 / Chassis and battery cradle', [0, 0, 0]);
  for (const z of [-0.165, 0.165]) {
    plate(chassis, 'Cradle side rail', [
      [-0.57, 0.91], [-0.44, 0.97], [-0.35, 0.42], [0.47, 0.34],
      [0.68, 0.93], [0.76, 0.98], [0.55, 0.27], [-0.40, 0.32],
    ], 0.045, z, 0.009);
    rod(chassis, 'Upper chassis spar', [-0.67, 1.075, z], [0.81, 1.065, z], 0.029);
    rod(chassis, 'Headstock brace', [-0.67, 1.08, z], [-0.43, 0.7, z], 0.025);
  }
  box(chassis, 'Battery tray', [0.88, 0.055, 0.33], [0.055, 0.335, 0]);
  box(chassis, 'Front tray crossmember', [0.08, 0.06, 0.40], [-0.38, 0.35, 0]);
  box(chassis, 'Rear tray crossmember', [0.08, 0.06, 0.40], [0.48, 0.32, 0]);
  rod(chassis, 'Steering head', [-0.75, 1.01, 0], [-0.66, 1.24, 0], 0.06);
  cylinder(chassis, 'Swingarm pivot sleeve', 0.078, 0.40, [-0.11, 0.42, 0]);
  for (const z of [-0.205, 0.205]) fastener(chassis, 'Pivot retaining bolt', -0.11, 0.42, z, 0.027);

  // 1 — Broad, flat enclosed swingarm; a long horizontal mass to the rear hub.
  const rear = stage('02 / Rear wheel and enclosed swingarm', [0.72, -0.12, -0.07]);
  wheel(rear, 'Rear', 1.04);
  for (const z of [-0.159, 0.159]) {
    const swing = new THREE.Shape();
    swing.moveTo(-0.15, 0.32);
    swing.lineTo(0.95, 0.325);
    swing.quadraticCurveTo(1.15, 0.325, 1.15, 0.425);
    swing.quadraticCurveTo(1.15, 0.525, 1.01, 0.525);
    swing.lineTo(-0.10, 0.54);
    swing.quadraticCurveTo(-0.23, 0.54, -0.23, 0.425);
    swing.quadraticCurveTo(-0.23, 0.32, -0.15, 0.32);
    extrusion(rear, 'Enclosed swingarm side', swing, 0.055, z, 0.008);
    fastener(rear, 'Swingarm pivot', -0.11, 0.43, z + Math.sign(z) * 0.039, 0.032);
    fastener(rear, 'Rear axle nut', 1.04, 0.43, z + Math.sign(z) * 0.039, 0.028);
    box(rear, 'Axle adjustment plate', [0.15, 0.063, 0.009], [0.992, 0.43, z + Math.sign(z) * 0.033]);
  }
  box(rear, 'Swingarm bridge', [0.22, 0.13, 0.28], [0.20, 0.435, 0]);
  rod(rear, 'Rear suspension body', [0.31, 0.48, 0], [0.48, 0.85, 0], 0.049);
  rod(rear, 'Rear suspension rod', [0.45, 0.80, 0], [0.54, 1.00, 0], 0.023);

  // 2 — Conventional raked fork, clean disc wheel and short floating fender.
  const front = stage('03 / Front wheel, forks and steering', [-0.72, -0.10, 0]);
  wheel(front, 'Front', -1.05);
  for (const z of [-0.17, 0.17]) {
    rod(front, 'Front fork slider', [-1.05, 0.43, z], [-0.88, 0.85, z], 0.036);
    rod(front, 'Front fork stanchion', [-0.89, 0.81, z], [-0.71, 1.255, z], 0.024);
    cylinder(front, 'Fork axle boss', 0.051, 0.072, [-1.05, 0.43, z]);
    fastener(front, 'Front axle retainer', -1.05, 0.43, z + Math.sign(z) * 0.043, 0.022);
  }
  box(front, 'Lower triple clamp', [0.105, 0.043, 0.43], [-0.767, 1.10, 0]);
  box(front, 'Upper triple clamp', [0.10, 0.045, 0.425], [-0.706, 1.247, 0]);
  rod(front, 'Steering stem', [-0.77, 1.08, 0], [-0.685, 1.29, 0], 0.025);
  const fenderShape = new THREE.Shape();
  fenderShape.moveTo(-1.39, 0.74);
  fenderShape.quadraticCurveTo(-1.11, 1.022, -0.79, 0.805);
  fenderShape.lineTo(-0.82, 0.77);
  fenderShape.quadraticCurveTo(-1.105, 0.965, -1.36, 0.71);
  fenderShape.closePath();
  extrusion(front, 'Short front fender', fenderShape, 0.235, 0, 0.004);
  for (const z of [-0.126, 0.126]) rod(front, 'Fender stay', [-0.91, 0.79, z], [-0.982, 0.61, z], 0.009);

  // 3 — Dense rectangular pack, rounded corners, access seam and upper module.
  const battery = stage('04 / Battery pack and controller', [0, 0.86, -0.05]);
  extrusion(battery, 'Battery case', roundedRect(-0.39, 0.365, 0.94, 0.635, 0.061), 0.335, 0, 0.011);
  for (const z of [-0.178, 0.178]) {
    extrusion(battery, 'Battery service panel', roundedRect(-0.355, 0.401, 0.868, 0.563, 0.043), 0.014, z, 0.002);
    for (const x of [-0.305, 0.465]) for (const y of [0.445, 0.918]) {
      fastener(battery, 'Battery panel screw', x, y, z + Math.sign(z) * 0.016, 0.010);
    }
    // Small ribs communicate a manufactured enclosure without becoming busy.
    for (let i = 0; i < 3; i++) box(battery, 'Cooling seam', [0.205, 0.006, 0.003], [0.285, 0.777 + i * 0.032, z + Math.sign(z) * 0.010]);
  }
  extrusion(battery, 'Controller module', roundedRect(-0.22, 1.015, 0.46, 0.095, 0.016), 0.28, 0, 0.005);
  box(battery, 'Controller connector', [0.065, 0.046, 0.12], [0.282, 1.054, 0]);
  for (const z of [-0.103, 0.103]) rod(battery, 'High voltage conduit', [0.29, 1.049, z], [0.44, 0.94, z], 0.012);

  // 4 — Two separate, symbolic cylinders. Their layout is explicitly generic.
  const motors = stage('05 / Paired motors — conceptual layout', [-0.16, -0.42, 0.49]);
  motors.userData.note = 'Symbolic paired central motors; this placement is speculative, not a claim about proprietary internals.';
  for (const z of [-0.205, 0.205]) {
    cylinder(motors, 'Symbolic motor housing', 0.207, 0.18, [-0.205, 0.469, z]);
    cylinder(motors, 'Motor case shoulder', 0.22, 0.028, [-0.205, 0.469, z + Math.sign(z) * 0.073]);
    cylinder(motors, 'Inner motor end bell', 0.173, 0.016, [-0.205, 0.469, z - Math.sign(z) * 0.10]);
    box(motors, 'Motor mounting ear', [0.105, 0.08, 0.09], [-0.205, 0.694, z]);
    fastener(motors, 'Motor mounting bolt', -0.205, 0.708, z + Math.sign(z) * 0.055, 0.018);
  }
  cylinder(motors, 'Central coupling', 0.067, 0.275, [-0.205, 0.469, 0]);

  // 5 — Six-bolt machined flange, open bearing bore and three shallow pockets.
  const cover = stage('06 / End cover and bearing carrier', [-0.06, -0.08, 0.94]);
  function coverAnnulus(radius) {
    const shape = new THREE.Shape();
    shape.absarc(0, 0, radius, 0, Math.PI * 2, false);
    const bore = new THREE.Path();
    bore.absarc(0, 0, 0.0694, 0, Math.PI * 2, true);
    shape.holes.push(bore);
    return shape;
  }
  function coverLayer(name, shape, depth, centerZ) {
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: false, steps: 1, curveSegments: 48,
    });
    geometry.translate(0, 0, -depth / 2);
    return part(cover, geometry, name, [-0.205, 0.469, centerZ]);
  }
  // The base remains under all three pockets; only the bearing bore passes
  // through the complete cover. Positive Z is the visible machined face.
  coverLayer('Circular motor end flange with open bore', coverAnnulus(0.229), 0.030, 0.329);
  const reliefFace = coverAnnulus(0.187);
  for (let i = 0; i < 3; i++) {
    const start = i * Math.PI * 2 / 3 + 0.25;
    const end = i * Math.PI * 2 / 3 + 1.35;
    const pocket = new THREE.Path();
    pocket.moveTo(0.167 * Math.cos(start), 0.167 * Math.sin(start));
    pocket.absarc(0, 0, 0.167, start, end, false);
    pocket.lineTo(0.118 * Math.cos(end), 0.118 * Math.sin(end));
    pocket.absarc(0, 0, 0.118, end, start, true);
    pocket.closePath();
    reliefFace.holes.push(pocket);
  }
  coverLayer('Raised face with three arcuate relief pockets', reliefFace, 0.045, 0.3665);
  coverLayer('Open bearing bore annulus', coverAnnulus(0.092), 0.009, 0.3935);
  for (let i = 0; i < 6; i++) {
    const a = i * Math.PI / 3;
    fastener(cover, 'Cover bolt ' + (i + 1), -0.205 + 0.2005 * Math.cos(a), 0.469 + 0.2005 * Math.sin(a), 0.35, 0.014);
  }

  // 6 — The defining continuous horizontal fairing, with raised nose and tail.
  const body = stage('07 / Body shrouds and integrated seat', [0.05, 0.55, 0]);
  const fairing = new THREE.Shape();
  fairing.moveTo(-1.18, 1.035);
  fairing.lineTo(-1.175, 1.25);
  fairing.quadraticCurveTo(-1.17, 1.305, -1.11, 1.30);
  fairing.lineTo(-0.84, 1.225);
  fairing.quadraticCurveTo(-0.72, 1.202, -0.54, 1.197);
  fairing.lineTo(0.87, 1.17);
  fairing.quadraticCurveTo(1.05, 1.166, 1.105, 1.102);
  fairing.lineTo(1.075, 1.042);
  fairing.lineTo(0.76, 1.024);
  fairing.lineTo(-0.62, 1.049);
  fairing.quadraticCurveTo(-0.95, 1.055, -1.18, 1.035);
  fairing.closePath();
  extrusion(body, 'Continuous nose-to-tail body shell', fairing, 0.37, 0, 0.013);

  const shoulder = new THREE.Shape();
  shoulder.moveTo(-0.56, 1.047);
  shoulder.lineTo(0.64, 1.026);
  shoulder.lineTo(0.47, 0.933);
  shoulder.lineTo(-0.41, 0.947);
  shoulder.quadraticCurveTo(-0.51, 0.956, -0.56, 1.047);
  for (const z of [-0.187, 0.187]) extrusion(body, 'Lower shoulder trim', shoulder, 0.018, z, 0.003);

  // A very shallow seat follows the same top line rather than adding a tank.
  const seat = new THREE.Shape();
  seat.moveTo(0.11, 1.189);
  seat.lineTo(0.84, 1.173);
  seat.quadraticCurveTo(0.90, 1.179, 0.90, 1.211);
  seat.lineTo(0.18, 1.226);
  seat.quadraticCurveTo(0.095, 1.226, 0.11, 1.189);
  extrusion(body, 'Minimal integrated seat pad', seat, 0.304, 0, 0.008);
  for (const z of [-0.204, 0.204]) {
    fastener(body, 'Nose panel screw', -1.06, 1.122, z, 0.009);
    fastener(body, 'Tail panel screw', 0.88, 1.09, z, 0.009);
  }

  // 7 — Minimal controls, inset lamps, foot pegs and discreet attachment points.
  const finishing = stage('08 / Controls, lighting and foot pegs', [-0.07, 0.39, 0.12]);
  for (const z of [-0.13, 0.13]) rod(finishing, 'Handlebar riser', [-0.695, 1.263, z], [-0.665, 1.409, z], 0.017);
  rod(finishing, 'Handlebar center', [-0.665, 1.409, -0.29], [-0.665, 1.409, 0.29], 0.018);
  for (const side of [-1, 1]) {
    rod(finishing, 'Handlebar grip', [-0.665, 1.409, side * 0.235], [-0.625, 1.415, side * 0.37], 0.024);
    rod(finishing, 'Brake lever', [-0.683, 1.417, side * 0.242], [-0.738, 1.415, side * 0.348], 0.009);
    box(finishing, 'Handlebar switch pod', [0.049, 0.047, 0.057], [-0.657, 1.412, side * 0.217]);
    rod(finishing, 'Foot peg support', [0.36, 0.395, side * 0.181], [0.40, 0.36, side * 0.28], 0.018);
    rod(finishing, 'Foot peg', [0.40, 0.36, side * 0.25], [0.40, 0.36, side * 0.385], 0.022);
    for (let i = 0; i < 4; i++) box(finishing, 'Foot peg tread', [0.047, 0.006, 0.008], [0.40, 0.382, side * (0.279 + i * 0.025)]);
  }
  const dash = box(finishing, 'Compact instrument pod', [0.12, 0.022, 0.135], [-0.759, 1.377, 0]);
  dash.rotation.z = -0.21;
  // Headlight points toward -X, inset as a narrow slot in the raised nose.
  box(finishing, 'Headlight bezel', [0.021, 0.072, 0.293], [-1.196, 1.217, 0]);
  box(finishing, 'Headlight lens', [0.024, 0.038, 0.252], [-1.21, 1.217, 0]);
  box(finishing, 'Tail lamp bezel', [0.025, 0.037, 0.243], [1.115, 1.093, 0]);
  box(finishing, 'Tail lamp lens', [0.028, 0.016, 0.211], [1.131, 1.093, 0]);
  cylinder(finishing, 'Front indicator left', 0.018, 0.026, [-0.954, 1.075, -0.231]);
  cylinder(finishing, 'Front indicator right', 0.018, 0.026, [-0.954, 1.075, 0.231]);

  root.updateMatrixWorld(true);
  return { root, stages, focusPoint: new THREE.Vector3(-0.02, 0.74, 0) };
}

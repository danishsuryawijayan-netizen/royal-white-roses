import {
  Group,
  Mesh,
  BoxGeometry,
  CylinderGeometry,
  MeshStandardMaterial,
  Color,
} from 'three';
import { createLeatherBookTexture } from '../utils/proceduralTextures.js';

/**
 * Membangun satu buku langka abad ke-17 dengan sampul kulit berornamen emas,
 * punggung beruas (raised spine cords), dan blok halaman perkamen tua.
 */
export function buildAntiqueBook({
  width = 0.34,
  height = 0.068,
  depth = 0.44,
  coverHex = '#4b171d',
  goldHex = '#cfa866',
  seed = 901,
} = {}) {
  const book = new Group();

  const coverTex = createLeatherBookTexture({ coverHex, goldHex, seed });
  const coverMat = new MeshStandardMaterial({
    map: coverTex,
    roughness: 0.56,
    metalness: 0.08,
  });

  const spineMat = new MeshStandardMaterial({
    color: new Color(coverHex),
    roughness: 0.54,
    metalness: 0.06,
  });

  const goldMat = new MeshStandardMaterial({
    color: new Color(goldHex),
    roughness: 0.34,
    metalness: 0.82,
  });

  const pageMat = new MeshStandardMaterial({
    color: new Color('#dfd1b3'),
    roughness: 0.84,
    metalness: 0.0,
  });

  const boardThick = 0.009;
  const pageHeight = height - boardThick * 2;

  // Sampul bawah & atas
  const bottomBoard = new Mesh(new BoxGeometry(width, boardThick, depth), coverMat);
  bottomBoard.position.y = boardThick * 0.5;
  bottomBoard.castShadow = true;
  bottomBoard.receiveShadow = true;
  book.add(bottomBoard);

  const topBoard = new Mesh(new BoxGeometry(width, boardThick, depth), coverMat);
  topBoard.position.y = height - boardThick * 0.5;
  topBoard.castShadow = true;
  topBoard.receiveShadow = true;
  book.add(topBoard);

  // Blok halaman perkamen sedikit masuk ke dalam sampul
  const pages = new Mesh(
    new BoxGeometry(width - 0.018, pageHeight, depth - 0.022),
    pageMat
  );
  pages.position.set(0.005, height * 0.5, 0);
  pages.castShadow = true;
  pages.receiveShadow = true;
  book.add(pages);

  // Punggung buku melengkung di sisi kiri (-X)
  const spine = new Mesh(
    new CylinderGeometry(height * 0.5, height * 0.5, depth, 16, 1, false, Math.PI * 0.5, Math.PI),
    spineMat
  );
  spine.rotation.x = Math.PI / 2;
  spine.position.set(-width * 0.5, height * 0.5, 0);
  spine.castShadow = true;
  book.add(spine);

  // 4 ruas tali emas timbul pada punggung buku
  [-0.14, -0.048, 0.048, 0.14].forEach((zOff) => {
    const rib = new Mesh(
      new CylinderGeometry(height * 0.525, height * 0.525, 0.012, 14, 1, false, Math.PI * 0.5, Math.PI),
      goldMat
    );
    rib.rotation.x = Math.PI / 2;
    rib.position.set(-width * 0.5, height * 0.5, zOff * (depth / 0.44));
    book.add(rib);
  });

  return book;
}

/**
 * Kumpulan buku abad ke-17 di atas meja kerajaan + satu buku khusus pada rak samping
 * untuk koreografi animasi buku jatuh dengan getaran dampak fisik.
 */
export function createAntiqueBooks() {
  const deskBooksGroup = new Group();
  deskBooksGroup.name = 'DeskAntiqueBooks';

  // Buku 1: Folio besar merah marun tua
  const book1 = buildAntiqueBook({
    width: 0.38,
    height: 0.078,
    depth: 0.48,
    coverHex: '#4f181f',
    goldHex: '#cfa760',
    seed: 911,
  });
  book1.position.set(-0.74, 0, -0.14);
  book1.rotation.y = 0.28;
  deskBooksGroup.add(book1);

  // Buku 2: Jilid zamrud tua bertumpuk miring di atas Buku 1
  const book2 = buildAntiqueBook({
    width: 0.32,
    height: 0.062,
    depth: 0.41,
    coverHex: '#1f392e',
    goldHex: '#d4b170',
    seed: 922,
  });
  book2.position.set(-0.72, 0.078, -0.12);
  book2.rotation.y = -0.16;
  deskBooksGroup.add(book2);

  // Buku 3: Buku catatan kulit cokelat walnut di sisi kiri depan
  const book3 = buildAntiqueBook({
    width: 0.27,
    height: 0.052,
    depth: 0.35,
    coverHex: '#382117',
    goldHex: '#c89e56',
    seed: 933,
  });
  book3.position.set(-0.92, 0, 0.36);
  book3.rotation.y = 0.58;
  deskBooksGroup.add(book3);

  // Buku 4: Buku yang disiapkan di tepi rak latar-tengah untuk koreografi BookFallAnimation
  const fallingBook = buildAntiqueBook({
    width: 0.28,
    height: 0.058,
    depth: 0.36,
    coverHex: '#591c25',
    goldHex: '#dbb876',
    seed: 944,
  });
  fallingBook.name = 'ShelfFallingBook';

  return {
    deskBooksGroup,
    fallingBook,
  };
}
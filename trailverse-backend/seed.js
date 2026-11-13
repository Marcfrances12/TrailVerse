require("dotenv").config();

const mongoose = require("mongoose");
const connectDB = require("./src/config/database");
const password = require("./src/utils/password");
const { generateSlug } = require("./src/utils/slug");
const { generateSku, generateSkuWithSequence } = require("./src/utils/sku");

const Role = require("./src/models/role.model");
const User = require("./src/models/user.model");
const Profile = require("./src/models/profile.model");
const Host = require("./src/models/host.model");
const Location = require("./src/models/location.model");
const Category = require("./src/models/category.model");
const Image = require("./src/models/image.model");
const Ruta = require("./src/models/ruta.model");
const Departure = require("./src/models/departure.model");

// Fotos de Wikimedia Commons (licencias libres). Las URLs están verificadas con la API de Commons.
// La clave es el pageid de la imagen en Commons.
const FOTOS = {
  "2543125": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Pou_clar.jpg/1280px-Pou_clar.jpg",
  "1245219": "https://upload.wikimedia.org/wikipedia/commons/6/6d/FontRoja_Alcoi.jpg",
  "1355000": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Cabo_gata_monsul.jpg",
  "1636072": "https://upload.wikimedia.org/wikipedia/commons/d/df/Vista_del_Circo_de_Gredos.jpg",
  "2960250": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/70/Hayedo_Montejo.JPG/1280px-Hayedo_Montejo.JPG",
  "2960367": "https://upload.wikimedia.org/wikipedia/commons/3/3c/Hayedo_Montejo_Haya.jpg",
  "2991110": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Mulhacen_north_face.JPG/1280px-Mulhacen_north_face.JPG",
  "3098594": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7f/Spain.Barcelona.Plaza.Catalunya.2010-1.Montseny.Detall.JPG/1280px-Spain.Barcelona.Plaza.Catalunya.2010-1.Montseny.Detall.JPG",
  "3843519": "https://upload.wikimedia.org/wikipedia/commons/a/a0/Montg%C3%B3.jpg",
  "3949575": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7b/Mulhacen_Winter.jpg/1280px-Mulhacen_Winter.jpg",
  "4181379": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Cima_y_laguna_de_Pe%C3%B1alara.JPG/1280px-Cima_y_laguna_de_Pe%C3%B1alara.JPG",
  "4811790": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/28/Panoramica_del_Cabo_de_Gata%2C_Almeria_%28Almeria%29.jpg/1280px-Panoramica_del_Cabo_de_Gata%2C_Almeria_%28Almeria%29.jpg",
  "8327198": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/ca/Garganta_del_Cares.jpg/1280px-Garganta_del_Cares.jpg",
  "12249869": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/Mulhacen01.jpg/1280px-Mulhacen01.jpg",
  "146653613": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/S00_048_Garganta_del_Cares.jpg/1280px-S00_048_Garganta_del_Cares.jpg",
  "14789249": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Teide_qtl1.jpg/1280px-Teide_qtl1.jpg",
  "23627536": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Bosque_Encantado%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_15.jpg/1280px-Bosque_Encantado%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_15.jpg",
  "23627551": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e0/Bosque_Encantado%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_19.jpg/1280px-Bosque_Encantado%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_19.jpg",
  "23627555": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Bosque_Encantado%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_20.jpg/1280px-Bosque_Encantado%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_20.jpg",
  "23634662": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fd/Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_05.jpg/1280px-Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_05.jpg",
  "23635354": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/72/Roque_Agando%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_01.jpg/1280px-Roque_Agando%2C_Parque_nacional_de_Garajonay%2C_La_Gomera%2C_Espa%C3%B1a%2C_2012-12-14%2C_DD_01.jpg",
  "27085195": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/01/Hayedo_de_Tejera_Negra_01.jpg/1280px-Hayedo_de_Tejera_Negra_01.jpg",
  "26311527": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8a/El_Montg%C3%B3_i_cam%C3%AD.JPG/1280px-El_Montg%C3%B3_i_cam%C3%AD.JPG",
  "34676034": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Refugio_Militar_Capitan_Cobo_-_Pico_Veleta_-_Sierra_Nevada_-_2014-08-07.jpg/1280px-Refugio_Militar_Capitan_Cobo_-_Pico_Veleta_-_Sierra_Nevada_-_2014-08-07.jpg",
  "35043089": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_06.JPG/1280px-Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_06.JPG",
  "35043101": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/85/Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_09.JPG/1280px-Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_09.JPG",
  "35043103": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f3/Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_10.JPG/1280px-Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_10.JPG",
  "35043147": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/df/Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_14.JPG/1280px-Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_14.JPG",
  "35043181": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a1/Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_18.JPG/1280px-Pe%C3%B1%C3%B3n_de_Ifach%2C_Calpe%2C_Espa%C3%B1a%2C_2014-07-01%2C_DD_18.JPG",
  "35177498": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/64/Pared_del_Circo_de_Gredos_nevada%2C_Sierra_de_Gredos%2C_marzo_de_2008.JPG/1280px-Pared_del_Circo_de_Gredos_nevada%2C_Sierra_de_Gredos%2C_marzo_de_2008.JPG",
  "35733499": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8b/Cabo_de_Gata%2C_Andalusia%2C_Spain.jpg/1280px-Cabo_de_Gata%2C_Andalusia%2C_Spain.jpg",
  "35900853": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/76/Detail_of_rocks%2C_Cabo_de_Gata%2C_Andalusia%2C_Spain.jpg/1280px-Detail_of_rocks%2C_Cabo_de_Gata%2C_Andalusia%2C_Spain.jpg",
  "40297951": "https://thumb.wikimedia.org/wikipedia/commons/thumb/6/66/Mas_de_Tetuan_-_Fuenta_Roja_-_Alcoy.JPG/1280px-Mas_de_Tetuan_-_Fuenta_Roja_-_Alcoy.JPG",
  "41362177": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Ruta_del_Cares_%2813904341627%29.jpg/1280px-Ruta_del_Cares_%2813904341627%29.jpg",
  "43396010": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Iglesia_de_Sant_Julia_del_Montseny.JPG/1280px-Iglesia_de_Sant_Julia_del_Montseny.JPG",
  "47593995": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Ordesa_-_Cola_de_Caballo_-_panoramio.jpg/1280px-Ordesa_-_Cola_de_Caballo_-_panoramio.jpg",
  "49239307": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/55/Circo_de_Gredos_desde_Morezon.jpg/1280px-Circo_de_Gredos_desde_Morezon.jpg",
  "51459947": "https://upload.wikimedia.org/wikipedia/commons/4/4b/Alcazaba_y_Mulhac%C3%A9n_%283237198166%29.jpg",
  "54432954": "https://upload.wikimedia.org/wikipedia/commons/4/47/Ordesa._Cola_de_caballo_-_panoramio.jpg",
  "55197139": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/09/Costa_da_morte_-_panoramio.jpg/1280px-Costa_da_morte_-_panoramio.jpg",
  "55784991": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2e/Alcoy%2C_Alicante%2C_Spain_-_panoramio_%281%29.jpg/1280px-Alcoy%2C_Alicante%2C_Spain_-_panoramio_%281%29.jpg",
  "56261280": "https://thumb.wikimedia.org/wikipedia/commons/thumb/3/3b/GARGANTA_DEL_CARES_DESDE_EL_REBECO_-_panoramio.jpg/1280px-GARGANTA_DEL_CARES_DESDE_EL_REBECO_-_panoramio.jpg",
  "57705204": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Cascada_Cola_de_Caballo_de_Ordesa_entre_monta%C3%B1as.jpg/1280px-Cascada_Cola_de_Caballo_de_Ordesa_entre_monta%C3%B1as.jpg",
  "58141806": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c9/Lagos_de_Covadonga_1.jpg/1280px-Lagos_de_Covadonga_1.jpg",
  "58570217": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/cc/Costa_da_Morte_2.jpg/1280px-Costa_da_Morte_2.jpg",
  "58570222": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/24/Costa_da_Morte_5.jpg/1280px-Costa_da_Morte_5.jpg",
  "59685650": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/58/Costa_da_Morte_-_Galicia_-_panoramio.jpg/1280px-Costa_da_Morte_-_Galicia_-_panoramio.jpg",
  "60521939": "https://upload.wikimedia.org/wikipedia/commons/0/0f/Vista_desde_Valencia_de_la_Sierra_Calderona_03.jpg",
  "66642008": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/a9/Sierra_Calderona_nevada_vista_desde_Valencia_03.jpg/1280px-Sierra_Calderona_nevada_vista_desde_Valencia_03.jpg",
  "66642011": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/26/Sierra_Calderona_nevada_vista_desde_Valencia_06.jpg/1280px-Sierra_Calderona_nevada_vista_desde_Valencia_06.jpg",
  "66642012": "https://thumb.wikimedia.org/wikipedia/commons/thumb/9/9b/Sierra_Calderona_nevada_vista_desde_Valencia_04.jpg/1280px-Sierra_Calderona_nevada_vista_desde_Valencia_04.jpg",
  "68467410": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/78/Berganzo_-_Ruta_del_Agua_-_Cascada_de_las_Herrer%C3%ADas_-BT-_05.jpg/1280px-Berganzo_-_Ruta_del_Agua_-_Cascada_de_las_Herrer%C3%ADas_-BT-_05.jpg",
  "68958393": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e6/Senderismo_y_rutas_BTT_por_la_Sierra_de_Loquiz_en_Navarra_03.jpg/1280px-Senderismo_y_rutas_BTT_por_la_Sierra_de_Loquiz_en_Navarra_03.jpg",
  "70957895": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/44/Oto%C3%B1o_en_el_Hayedo_de_Montejo_%2830777813011%29.jpg/1280px-Oto%C3%B1o_en_el_Hayedo_de_Montejo_%2830777813011%29.jpg",
  "71015392": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Rio_Arazas_Ordesa_Monteperdido_Cola_Caballo_Torla_2.jpg/1280px-Rio_Arazas_Ordesa_Monteperdido_Cola_Caballo_Torla_2.jpg",
  "71280566": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/Pou_Clar_Tetric_%2820941263%29.jpeg/1280px-Pou_Clar_Tetric_%2820941263%29.jpeg",
  "71290252": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1d/El_Pou_Dels_Cavalls_Ii_%2820932823%29.jpeg/1280px-El_Pou_Dels_Cavalls_Ii_%2820932823%29.jpeg",
  "71349978": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/29/Viaductos_De_Los_T%C3%BAneles_De_La_Font_Roja_%28231386627%29.jpeg/1280px-Viaductos_De_Los_T%C3%BAneles_De_La_Font_Roja_%28231386627%29.jpeg",
  "74371192": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/18/Hayedo_de_Montejo_%282713820297%29.jpg/1280px-Hayedo_de_Montejo_%282713820297%29.jpg",
  "74420061": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/4f/Sierra_de_Cazorla_%2845261076702%29.jpg/1280px-Sierra_de_Cazorla_%2845261076702%29.jpg",
  "79339550": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/f1/Cerrada_de_Elias_Cazorla_Ja%C3%A9n_2.jpg/1280px-Cerrada_de_Elias_Cazorla_Ja%C3%A9n_2.jpg",
  "79339552": "https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c5/Cerrada_de_Elias_Cazorla_Ja%C3%A9n_1.jpg/1280px-Cerrada_de_Elias_Cazorla_Ja%C3%A9n_1.jpg",
  "79339555": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Cerrada_de_Elias_Cazorla_Ja%C3%A9n_4.jpg/1280px-Cerrada_de_Elias_Cazorla_Ja%C3%A9n_4.jpg",
  "79339556": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8c/Cerrada_de_Elias_Cazorla_Ja%C3%A9n_6.jpg/1280px-Cerrada_de_Elias_Cazorla_Ja%C3%A9n_6.jpg",
  "80713517": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Lagos_de_Covadonga.jpg/1280px-Lagos_de_Covadonga.jpg",
  "80713770": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/03/Lagos_de_Covadonga%2C2.jpg/1280px-Lagos_de_Covadonga%2C2.jpg",
  "92670552": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/56/Costa_da_Morte_desde_Caion.jpg/1280px-Costa_da_Morte_desde_Caion.jpg",
  "93078278": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/1b/Picos_de_Europa_vistos_desde_la_Fuente_del_Chivo.jpg/1280px-Picos_de_Europa_vistos_desde_la_Fuente_del_Chivo.jpg",
  "94087706": "https://thumb.wikimedia.org/wikipedia/commons/thumb/e/ed/Lagos_de_Covadonga_Ago_2020.jpeg/1280px-Lagos_de_Covadonga_Ago_2020.jpeg",
  "98416621": "https://thumb.wikimedia.org/wikipedia/commons/thumb/1/11/Sierra_Nevada_Pradollano_panorama_2.jpg/1280px-Sierra_Nevada_Pradollano_panorama_2.jpg",
  "99598037": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/bb/Macizo_oriental_de_los_Picos_de_Europa_contemplado_desde_el_pico_Curavacas.jpg/1280px-Macizo_oriental_de_los_Picos_de_Europa_contemplado_desde_el_pico_Curavacas.jpg",
  "104969575": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/87/Teide_Canadas.jpg/1280px-Teide_Canadas.jpg",
  "105061598": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d8/Circo_de_Gredos_sep17.jpg/1280px-Circo_de_Gredos_sep17.jpg",
  "112157495": "https://thumb.wikimedia.org/wikipedia/commons/thumb/a/ac/Life_Trit%C3%B3_Montseny_1.jpg/1280px-Life_Trit%C3%B3_Montseny_1.jpg",
  "112157498": "https://upload.wikimedia.org/wikipedia/commons/c/c3/Life_Trit%C3%B3_Montseny_6.jpg",
  "112157499": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7c/Life_Trit%C3%B3_Montseny_4.jpg/1280px-Life_Trit%C3%B3_Montseny_4.jpg",
  "112503385": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0d/La_Pedriza_-_51679516874.jpg/1280px-La_Pedriza_-_51679516874.jpg",
  "114558777": "https://thumb.wikimedia.org/wikipedia/commons/thumb/0/0e/Granitformationen%2C_La_Pedriza_bei_Manzanares_el_Real%2C_Spanien_VII.jpg/1280px-Granitformationen%2C_La_Pedriza_bei_Manzanares_el_Real%2C_Spanien_VII.jpg",
  "114811451": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b6/Granitformationen%2C_La_Pedriza_bei_Manzanares_el_Real%2C_Spanien_XXI.jpg/1280px-Granitformationen%2C_La_Pedriza_bei_Manzanares_el_Real%2C_Spanien_XXI.jpg",
  "114832136": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/2c/Granitformationen%2C_La_Pedriza_bei_Manzanares_el_Real%2C_Spanien_XXIV.jpg/1280px-Granitformationen%2C_La_Pedriza_bei_Manzanares_el_Real%2C_Spanien_XXIV.jpg",
  "114878626": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b1/El_Montg%C3%B3_i_la_Mediterr%C3%A0nia.jpg/1280px-El_Montg%C3%B3_i_la_Mediterr%C3%A0nia.jpg",
  "114878630": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/8e/El_Montg%C3%B3.jpg/1280px-El_Montg%C3%B3.jpg",
  "118273224": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/ba/WLE_-_2022_-_Parque_nacional_de_Ordesa_y_Monte_Perdido_-_01.jpg/1280px-WLE_-_2022_-_Parque_nacional_de_Ordesa_y_Monte_Perdido_-_01.jpg",
  "129950175": "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/47/Bancals_al_costat_del_cam%C3%AD_de_la_Col%C3%B2nia_%28Mass%C3%ADs_del_Montg%C3%B3%2C_Pa%C3%ADs_Valenci%C3%A0%29.jpg/1280px-Bancals_al_costat_del_cam%C3%AD_de_la_Col%C3%B2nia_%28Mass%C3%ADs_del_Montg%C3%B3%2C_Pa%C3%ADs_Valenci%C3%A0%29.jpg",
  "132285054": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b4/Lagunas_en_la_Monta%C3%B1a_Pe%C3%B1alara_Sierra_de_Guadarrama.jpg/1280px-Lagunas_en_la_Monta%C3%B1a_Pe%C3%B1alara_Sierra_de_Guadarrama.jpg",
  "132285074": "https://thumb.wikimedia.org/wikipedia/commons/thumb/f/fa/Monta%C3%B1a_Pe%C3%B1alara_Sierra_de_Guadarrama_08.jpg/1280px-Monta%C3%B1a_Pe%C3%B1alara_Sierra_de_Guadarrama_08.jpg",
  "136192299": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/81/Teide_Caldera_Rim_-_2.jpg/1280px-Teide_Caldera_Rim_-_2.jpg",
  "138188932": "https://thumb.wikimedia.org/wikipedia/commons/thumb/7/7d/Camino_al_Pico_de_Pe%C3%B1alara._Sierra_de_Guadarrama._Espa%C3%B1a%2C_Spain.jpg/1280px-Camino_al_Pico_de_Pe%C3%B1alara._Sierra_de_Guadarrama._Espa%C3%B1a%2C_Spain.jpg",
  "157117129": "https://thumb.wikimedia.org/wikipedia/commons/thumb/d/d9/Ascendiendo_a_Pe%C3%B1alara_con_nieve._Sierra_de_Guadarrama._Espa%C3%B1a._Spain.jpg/1280px-Ascendiendo_a_Pe%C3%B1alara_con_nieve._Sierra_de_Guadarrama._Espa%C3%B1a._Spain.jpg",
  "162525717": "https://thumb.wikimedia.org/wikipedia/commons/thumb/8/84/Teide_-_Pico_Viejo_3.jpg/1280px-Teide_-_Pico_Viejo_3.jpg",
  "167328375": "https://thumb.wikimedia.org/wikipedia/commons/thumb/b/b5/Campos_de_Hern%C3%A1n_Perea_-_Sierra_de_Cazorla_-_Spain.jpg/1280px-Campos_de_Hern%C3%A1n_Perea_-_Sierra_de_Cazorla_-_Spain.jpg",
  "170134092": "https://thumb.wikimedia.org/wikipedia/commons/thumb/2/20/Playa_Monsul_-_Cabo_de_Gata.jpg/1280px-Playa_Monsul_-_Cabo_de_Gata.jpg",
  "182039867": "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/5c/Vistas_de_Sierra_Calderona_desde_Alaqu%C3%A0s.jpg/1280px-Vistas_de_Sierra_Calderona_desde_Alaqu%C3%A0s.jpg"
};

const foto = (pageId) => {
  const url = FOTOS[String(pageId)];
  if (!url) throw new Error(`Falta la foto ${pageId} en FOTOS`);
  return url;
};

const USUARIOS = [
  { email: "admin@trailverse.com", name: "Admin User", rol: "ADMIN" },
  { email: "maria@trailverse.com", name: "María García", rol: "USER" },
  { email: "carlos@trailverse.com", name: "Carlos Ruiz", rol: "USER" },
  { email: "ana@trailverse.com", name: "Ana López", rol: "USER" },
  { email: "lucia@trailverse.com", name: "Lucía Torres", rol: "USER" },
  { email: "pablo@trailverse.com", name: "Pablo Serrano", rol: "USER" },
  { email: "elena@trailverse.com", name: "Elena Martín", rol: "USER" }
];

const LOCALIZACIONES = [
  { key: "calpe", nombre: "Calpe", provincia: "Alicante", comunidad: "Comunidad Valenciana", coords: [0.0582, 38.6437], fotos: [35043147, 35043089] },
  { key: "denia", nombre: "Dénia", provincia: "Alicante", comunidad: "Comunidad Valenciana", coords: [0.1027, 38.8403], fotos: [114878630, 3843519] },
  { key: "ontinyent", nombre: "Ontinyent", provincia: "Valencia", comunidad: "Comunidad Valenciana", coords: [-0.6065, 38.8208], fotos: [2543125, 71280566] },
  { key: "alcoy", nombre: "Alcoy", provincia: "Alicante", comunidad: "Comunidad Valenciana", coords: [-0.4735, 38.6983], fotos: [1245219, 40297951] },
  { key: "serra", nombre: "Serra", provincia: "Valencia", comunidad: "Comunidad Valenciana", coords: [-0.4265, 39.7008], fotos: [60521939, 66642008] },
  { key: "ordesa", nombre: "Ordesa y Monte Perdido", provincia: "Huesca", comunidad: "Aragón", coords: [0.0328, 42.6743], fotos: [118273224, 57705204] },
  { key: "picos", nombre: "Picos de Europa", provincia: "Asturias", comunidad: "Principado de Asturias", coords: [-4.9, 43.2], fotos: [93078278, 99598037] },
  { key: "gredos", nombre: "Sierra de Gredos", provincia: "Ávila", comunidad: "Castilla y León", coords: [-5.0, 40.27], fotos: [105061598, 35177498] },
  { key: "cabogata", nombre: "Cabo de Gata", provincia: "Almería", comunidad: "Andalucía", coords: [-2.2, 36.72], fotos: [35733499, 170134092] },
  { key: "nevada", nombre: "Sierra Nevada", provincia: "Granada", comunidad: "Andalucía", coords: [-3.39, 37.09], fotos: [34676034, 98416621] },
  { key: "guadarrama", nombre: "Sierra de Guadarrama", provincia: "Madrid", comunidad: "Comunidad de Madrid", coords: [-3.9, 40.8], fotos: [112503385, 157117129] },
  { key: "teide", nombre: "Teide", provincia: "Santa Cruz de Tenerife", comunidad: "Canarias", coords: [-16.64, 28.27], fotos: [104969575, 136192299] },
  { key: "garajonay", nombre: "Garajonay", provincia: "Santa Cruz de Tenerife", comunidad: "Canarias", coords: [-17.24, 28.12], fotos: [23627551, 23634662] },
  { key: "costadamorte", nombre: "Costa da Morte", provincia: "A Coruña", comunidad: "Galicia", coords: [-9.05, 43.12], fotos: [92670552, 55197139] },
  { key: "montseny", nombre: "Montseny", provincia: "Barcelona", comunidad: "Cataluña", coords: [2.43, 41.78], fotos: [112157499, 43396010] },
  { key: "cazorla", nombre: "Cazorla", provincia: "Jaén", comunidad: "Andalucía", coords: [-2.9, 37.9], fotos: [74420061, 167328375] }
];

const HOSTS = [
  { key: "aventura", name: "Aventura Mediterránea", bio: "Turismo activo en la costa y las sierras del Mediterráneo.", contactEmail: "info@aventuramediterranea.com", phone: "+34 600 123 456", usuario: "maria@trailverse.com" },
  { key: "montana", name: "Montaña Viva", bio: "Guías certificados para rutas de montaña.", contactEmail: "hola@montanaviva.com", phone: "+34 600 654 321", usuario: "carlos@trailverse.com" },
  { key: "norte", name: "Rutas del Norte", bio: "Itinerarios por Asturias y Galicia con guías locales.", contactEmail: "hola@rutasdelnorte.com", phone: "+34 600 222 333", usuario: "ana@trailverse.com" },
  { key: "nevada", name: "Sierra Nevada Trekking", bio: "Senderismo y alta montaña en Sierra Nevada.", contactEmail: "info@sierranevadatrekking.com", phone: "+34 600 333 444", usuario: "lucia@trailverse.com" },
  { key: "pirineos", name: "Pirineos Aventura", bio: "Expediciones guiadas por el Pirineo aragonés.", contactEmail: "reservas@pirineosaventura.com", phone: "+34 600 444 555", usuario: "pablo@trailverse.com" },
  { key: "canarias", name: "Canarias Trail", bio: "Rutas volcánicas y de laurisilva en las islas.", contactEmail: "hola@canariastrail.com", phone: "+34 600 555 666", usuario: "elena@trailverse.com" }
];

const CATEGORIAS = [
  { key: "costeras", name: "Rutas costeras", slug: "rutas-costeras", foto: 170134092 },
  { key: "montana", name: "Rutas de montaña", slug: "rutas-de-montana", foto: 157117129 },
  { key: "ciclismo", name: "Ciclismo", slug: "ciclismo", foto: 68958393 },
  { key: "cascadas", name: "Rutas de cascadas", slug: "rutas-de-cascadas", foto: 68467410 },
  { key: "familias", name: "Rutas para familias", slug: "rutas-para-familias", foto: 23627536 },
  { key: "bosques", name: "Bosques y hayedos", slug: "bosques-y-hayedos", foto: 27085195 },
  { key: "volcanes", name: "Volcanes", slug: "volcanes", foto: 136192299 },
  { key: "nieve", name: "Nieve y alta montaña", slug: "nieve-y-alta-montana", foto: 66642008 },
  { key: "miradores", name: "Miradores", slug: "miradores", foto: 93078278 },
  { key: "desierto", name: "Paisajes áridos", slug: "paisajes-aridos", foto: 4811790 },
  { key: "nocturnas", name: "Rutas nocturnas", slug: "rutas-nocturnas", foto: null },
  { key: "lagos", name: "Lagos y humedales", slug: "lagos-y-humedales", foto: 132285054 }
];

// FAQs de ejemplo para el agente IA (datos ficticios de desarrollo).
const FAQS_POR_RUTA = {
  "Ruta del Montgó": [
    { pregunta: "¿Es apta para principiantes?", respuesta: "No del todo. Tiene un desnivel de 750 m y tramos con roca; se recomienda experiencia en montaña.", tags: ["dificultad"] },
    { pregunta: "¿Se puede ir con perro?", respuesta: "Sí, con correa en todo el recorrido. Lleva agua para el animal.", tags: ["perros", "mascotas"] },
    { pregunta: "¿Hay agua en la ruta?", respuesta: "No hay fuentes fiables en el recorrido. Lleva al menos 2 litros por persona.", tags: ["agua"] }
  ],
  "Ruta del Pou Clar": [
    { pregunta: "¿Es adecuada para niños?", respuesta: "Sí, es un paseo sencillo de 3,2 km y 90 m de desnivel, ideal para familias.", tags: ["familias", "niños"] },
    { pregunta: "¿Se puede ir con perro?", respuesta: "Sí, pero mantenlo con correa cerca de las zonas de agua.", tags: ["perros", "mascotas"] }
  ],
  "Ruta del Bosque Encantado": [
    { pregunta: "¿Cuál es la mejor época?", respuesta: "Primavera y otoño. En invierno la niebla y la humedad son frecuentes.", tags: ["época", "clima"] },
    { pregunta: "¿Qué material necesito?", respuesta: "Calzado de montaña, impermeable ligero y agua. La laurisilva es húmeda y resbaladiza.", tags: ["material"] }
  ]
};

const RUTAS = [
  { nombre: "Ruta del Peñón de Ifach", descripcion: "Sendero costero con vistas al Mediterráneo desde la cima del Peñón de Ifach, en el Parque Natural de la Sierra Gelada.", loc: "calpe", host: "aventura", cats: ["costeras", "montana"], dificultad: "media", distanciaKm: 4.8, desnivelM: 330, duracionHoras: 2.5, circular: false, fotos: [35043181, 35043103, 35043101] },
  { nombre: "Ruta del Montgó", descripcion: "Ascenso al Montgó con vistas panorámicas de la bahía de Dénia y de la costa.", loc: "denia", host: "montana", cats: ["montana"], dificultad: "dificil", distanciaKm: 8.5, desnivelM: 750, duracionHoras: 4.5, circular: true, fotos: [114878630, 129950175, 26311527, 114878626] },
  { nombre: "Ruta del Pou Clar", descripcion: "Paseo sencillo por un entorno con agua y zonas de descanso, ideal para ir en familia.", loc: "ontinyent", host: "aventura", cats: ["cascadas", "familias"], dificultad: "facil", distanciaKm: 3.2, desnivelM: 90, duracionHoras: 1.5, circular: true, fotos: [71290252, 71280566, 2543125] },
  { nombre: "Ruta de la Font Roja", descripcion: "Recorrido por el parque natural de la Font Roja, entre bosques de pino y los viaductos de una antigua línea de tren.", loc: "alcoy", host: "montana", cats: ["bosques", "montana"], dificultad: "media", distanciaKm: 7.1, desnivelM: 410, duracionHoras: 3, circular: true, fotos: [40297951, 1245219, 71349978, 55784991] },
  { nombre: "Ruta de la Calderona", descripcion: "Ruta de montaña y ciclismo por la Sierra Calderona, con vistas sobre el área metropolitana de Valencia.", loc: "serra", host: "aventura", cats: ["montana", "ciclismo"], dificultad: "media", distanciaKm: 10.2, desnivelM: 520, duracionHoras: 4, circular: true, fotos: [182039867, 60521939, 66642012, 66642011] },
  { nombre: "Ruta de la Cola de Caballo", descripcion: "Subida al salto de la Cola de Caballo por el valle de Ordesa, acompañados por el río Arazas.", loc: "ordesa", host: "pirineos", cats: ["cascadas", "montana"], dificultad: "dificil", distanciaKm: 8.4, desnivelM: 520, duracionHoras: 4.5, circular: false, fotos: [54432954, 47593995, 57705204, 71015392] },
  { nombre: "Ruta del Cares", descripcion: "Travesía por la Garganta del Cares, entre Asturias y León, con paredes verticales y el río a los pies.", loc: "picos", host: "norte", cats: ["montana", "miradores"], dificultad: "media", distanciaKm: 11.9, desnivelM: 300, duracionHoras: 5, circular: false, fotos: [8327198, 41362177, 146653613, 56261280] },
  { nombre: "Circo de Gredos", descripcion: "Ruta de alta montaña al Circo de Gredos, con paredes glaciares y lagunas; en invierno exige equipo de nieve.", loc: "gredos", host: "montana", cats: ["montana", "nieve"], dificultad: "dificil", distanciaKm: 12.5, desnivelM: 900, duracionHoras: 6, circular: false, fotos: [1636072, 49239307, 35177498, 105061598] },
  { nombre: "Costa de Cabo de Gata", descripcion: "Sendero costero por el Parque Natural de Cabo de Gata, entre calas, acantilados volcánicos y paisajes áridos.", loc: "cabogata", host: "aventura", cats: ["costeras", "desierto"], dificultad: "facil", distanciaKm: 9, desnivelM: 150, duracionHoras: 3, circular: false, fotos: [35900853, 1355000, 4811790, 35733499] },
  { nombre: "Ruta del Mulhacén", descripcion: "Ascenso al techo de la península por la vertiente norte del Mulhacén; con nieve en invierno requiere crampones.", loc: "nevada", host: "nevada", cats: ["nieve", "montana"], dificultad: "dificil", distanciaKm: 17, desnivelM: 1100, duracionHoras: 8, circular: false, fotos: [3949575, 12249869, 2991110, 51459947] },
  { nombre: "Ruta del Hayedo de Montejo", descripcion: "Paseo por uno de los hayedos mejor conservados de la península, especialmente bonito en otoño.", loc: "guadarrama", host: "montana", cats: ["bosques", "familias"], dificultad: "facil", distanciaKm: 5.5, desnivelM: 180, duracionHoras: 2.5, circular: true, fotos: [2960250, 70957895, 74371192, 2960367] },
  { nombre: "Ruta de La Pedriza", descripcion: "Recorrido por el paisaje granítico de La Pedriza, con pasos entre bloques y miradores sobre el embalse.", loc: "guadarrama", host: "montana", cats: ["montana", "miradores"], dificultad: "media", distanciaKm: 9, desnivelM: 600, duracionHoras: 4, circular: true, fotos: [112503385, 114811451, 114558777, 114832136] },
  { nombre: "Ruta de la Montaña Pelada", descripcion: "Ascenso a la Montaña Pelada con vistas al Teide y a la caldera del parque nacional.", loc: "teide", host: "canarias", cats: ["volcanes", "montana"], dificultad: "media", distanciaKm: 6.5, desnivelM: 450, duracionHoras: 3.5, circular: false, fotos: [136192299, 162525717, 14789249, 104969575] },
  { nombre: "Ruta del Bosque Encantado", descripcion: "Paseo por la laurisilva del Parque Nacional de Garajonay, un bosque húmedo y envuelto en niebla.", loc: "garajonay", host: "canarias", cats: ["bosques", "familias"], dificultad: "facil", distanciaKm: 6.5, desnivelM: 300, duracionHoras: 3, circular: true, fotos: [23627551, 23627536, 23627555, 23635354] },
  { nombre: "Ruta de los Faros de la Costa da Morte", descripcion: "Travesía costera por la Costa da Morte, entre acantilados, playas salvajes y faros.", loc: "costadamorte", host: "norte", cats: ["costeras", "miradores"], dificultad: "media", distanciaKm: 14, desnivelM: 300, duracionHoras: 4.5, circular: false, fotos: [92670552, 58570222, 58570217, 59685650] },
  { nombre: "Ruta del Turó de l'Home", descripcion: "Subida al Turó de l'Home, la cumbre más alta del macizo del Montseny, con vistas al litoral catalán.", loc: "montseny", host: "aventura", cats: ["montana", "miradores"], dificultad: "dificil", distanciaKm: 11, desnivelM: 800, duracionHoras: 5, circular: true, fotos: [3098594, 43396010, 112157495, 112157498] },
  { nombre: "Ruta de la Cerrada de Elías", descripcion: "Recorrido por la Cerrada de Elías, un desfiladero de paredes calizas en la Sierra de Cazorla.", loc: "cazorla", host: "montana", cats: ["montana"], dificultad: "media", distanciaKm: 9.5, desnivelM: 400, duracionHoras: 4, circular: false, fotos: [79339550, 79339555, 79339552, 79339556] },
  { nombre: "Ruta nocturna de la Calderona", descripcion: "Caminata al atardecer por la Sierra Calderona, con las luces de la ciudad y el cielo estrellado.", loc: "serra", host: "aventura", cats: ["nocturnas", "montana"], dificultad: "facil", distanciaKm: 5, desnivelM: 100, duracionHoras: 2, circular: true, fotos: [66642008, 60521939, 182039867] },
  { nombre: "Ruta de los Lagos de Covadonga", descripcion: "Paseo por los Lagos de Covadonga, entre praderas y bosques de montaña.", loc: "picos", host: "norte", cats: ["lagos", "miradores"], dificultad: "media", distanciaKm: 7.5, desnivelM: 350, duracionHoras: 3, circular: true, fotos: [80713770, 80713517, 58141806, 94087706] },
  { nombre: "Ruta de la Laguna de Peñalara", descripcion: "Ascenso a Peñalara, la cumbre más alta del Sistema Central, con sus lagunas glaciares.", loc: "guadarrama", host: "montana", cats: ["lagos", "nieve"], dificultad: "dificil", distanciaKm: 13, desnivelM: 700, duracionHoras: 5.5, circular: false, fotos: [132285054, 132285074, 4181379, 138188932, 157117129] }
];

const PRECIO_POR_DIFICULTAD = { facil: 5, media: 12, dificil: 18 };
const CAPACIDADES = [12, 15, 20, 25];

const seed = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      throw new Error("El seed no se puede ejecutar en producción");
    }
    if (!process.env.SEED_PASSWORD || process.env.SEED_PASSWORD.length < 12) {
      throw new Error("Define SEED_PASSWORD con al menos 12 caracteres para crear los usuarios demo");
    }

    await connectDB();

    await Promise.all([
      Role.deleteMany({}),
      User.deleteMany({}),
      Profile.deleteMany({}),
      Host.deleteMany({}),
      Location.deleteMany({}),
      Category.deleteMany({}),
      Image.deleteMany({}),
      Ruta.deleteMany({}),
      Departure.deleteMany({})
    ]);

    const roles = await Role.insertMany([
      { name: "ADMIN", permissions: ["all"] },
      { name: "USER", permissions: ["read"] }
    ]);
    const rolDe = (nombre) => roles.find((rol) => rol.name === nombre)._id;

    const passwordHash = await password.hashPassword(process.env.SEED_PASSWORD);
    const users = await User.insertMany(
      USUARIOS.map((usuario) => ({ email: usuario.email, passwordHash, roleId: rolDe(usuario.rol) }))
    );
    const usuarioPorEmail = (email) => users[USUARIOS.findIndex((usuario) => usuario.email === email)]._id;

    await Profile.insertMany(
      USUARIOS.map((usuario) => ({ userId: usuarioPorEmail(usuario.email), name: usuario.name }))
    );

    const locations = await Location.insertMany(
      LOCALIZACIONES.map((loc) => ({
        nombre: loc.nombre,
        slug: generateSlug(loc.nombre),
        provincia: loc.provincia,
        comunidad: loc.comunidad,
        pais: "España",
        geo: { type: "Point", coordinates: loc.coords }
      }))
    );
    const localizacionPorKey = (key) => locations[LOCALIZACIONES.findIndex((loc) => loc.key === key)];

    const hosts = await Host.insertMany(
      HOSTS.map((host) => ({
        name: host.name,
        slug: generateSlug(host.name),
        bio: host.bio,
        contactEmail: host.contactEmail,
        phone: host.phone,
        userId: usuarioPorEmail(host.usuario)
      }))
    );
    const hostPorKey = (key) => hosts[HOSTS.findIndex((host) => host.key === key)];

    const categories = await Category.insertMany(
      CATEGORIAS.map((categoria) => ({ name: categoria.name, slug: categoria.slug, type: "ruta" }))
    );
    const categoriaPorKey = (key) => categories[CATEGORIAS.findIndex((categoria) => categoria.key === key)];

    const rutas = await Ruta.insertMany(
      RUTAS.map((ruta) => {
        const localizacion = localizacionPorKey(ruta.loc);
        return {
          nombre: ruta.nombre,
          descripcion: ruta.descripcion,
          dificultad: ruta.dificultad,
          distanciaKm: ruta.distanciaKm,
          desnivelM: ruta.desnivelM,
          duracionHoras: ruta.duracionHoras,
          circular: ruta.circular,
          hostId: hostPorKey(ruta.host)._id,
          locationId: localizacion._id,
          categoryIds: ruta.cats.map((key) => categoriaPorKey(key)._id),
          coverImage: { url: foto(ruta.fotos[0]), alt: ruta.nombre },
          startPoint: { type: "Point", coordinates: localizacion.geo.coordinates },
          faqs: FAQS_POR_RUTA[ruta.nombre] ?? [],
          slug: generateSlug(ruta.nombre)
        };
      })
    );

    const skusAsignados = new Map();
    const skuDeRuta = (ruta) => {
      const location = locations.find((item) => String(item._id) === String(ruta.locationId));
      if (!location) throw new Error("No se encontró la localización de la ruta al generar el SKU");

      const base = generateSku({
        nombreLocalizacion: location.nombre,
        provincia: location.provincia,
        dificultad: ruta.dificultad,
        distanciaKm: ruta.distanciaKm
      });
      const numero = skusAsignados.get(base) ?? 0;
      skusAsignados.set(base, numero + 1);
      return numero === 0 ? base : generateSkuWithSequence(base, numero);
    };

    const now = new Date();
    const salidas = [];
    rutas.forEach((ruta, indice) => {
      const cuantas = 2 + (indice % 3);
      for (let k = 0; k < cuantas; k++) {
        const inicio = new Date(
          now.getFullYear(),
          now.getMonth() + 1 + ((indice + k) % 3),
          3 + ((indice * 5 + k * 9) % 24),
          8 + ((indice + k) % 3),
          0
        );
        const capacidad = CAPACIDADES[(indice + k) % CAPACIDADES.length];
        const estado = (indice + k) % 7;

        let status = "open";
        let stock = capacidad - ((indice * 3 + k * 2) % Math.max(1, Math.floor(capacidad / 2)));
        if (estado === 0) {
          status = "full";
          stock = 0;
        }
        if (estado === 5) {
          status = "cancelled";
          stock = capacidad;
        }

        const dificultad = ruta.dificultad;
        salidas.push({
          rutaId: ruta._id,
          sku: skuDeRuta(ruta),
          startDate: inicio,
          endDate: ruta.duracionHoras >= 6 && k === 0 ? new Date(inicio.getTime() + 24 * 3600 * 1000) : null,
          meetingPoint: `Punto de encuentro: ${localizacionPorKey(RUTAS[indice].loc).nombre}`,
          price: { amount: PRECIO_POR_DIFICULTAD[dificultad] + (k === 0 ? 0 : 2), currency: "EUR" },
          capacity: capacidad,
          stock,
          status
        });
      }
    });
    await Departure.insertMany(salidas);

    const imagenes = [];
    locations.forEach((localizacion, indice) => {
      LOCALIZACIONES[indice].fotos.forEach((pageId, posicion) => {
        imagenes.push({
          url: foto(pageId),
          alt: `${localizacion.nombre}${posicion ? ` · foto ${posicion + 1}` : ""}`,
          entityType: "location",
          entityId: localizacion._id,
          position: posicion,
          isCover: posicion === 0
        });
      });
    });
    categories.forEach((categoria, indice) => {
      const pageId = CATEGORIAS[indice].foto;
      if (!pageId) return;
      imagenes.push({
        url: foto(pageId),
        alt: categoria.name,
        entityType: "categoria",
        entityId: categoria._id,
        position: 0,
        isCover: true
      });
    });
    rutas.forEach((ruta, indice) => {
      RUTAS[indice].fotos.forEach((pageId, posicion) => {
        imagenes.push({
          url: foto(pageId),
          alt: `${ruta.nombre} · foto ${posicion + 1}`,
          entityType: "ruta",
          entityId: ruta._id,
          position: posicion,
          isCover: posicion === 0
        });
      });
    });
    await Image.insertMany(imagenes);

    await Promise.all([
      Role.syncIndexes(),
      User.syncIndexes(),
      Profile.syncIndexes(),
      Host.syncIndexes(),
      Location.syncIndexes(),
      Category.syncIndexes(),
      Image.syncIndexes(),
      Ruta.syncIndexes(),
      Departure.syncIndexes()
    ]);

    console.log(
      `Seed completado: ${roles.length} roles, ${users.length} usuarios, ${hosts.length} hosts, ` +
      `${locations.length} localizaciones, ${categories.length} categorías, ${rutas.length} rutas, ` +
      `${salidas.length} salidas, ${imagenes.length} imágenes.`
    );
  } catch (error) {
    console.error("Error ejecutando seed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

seed();

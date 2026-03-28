'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

const DEFAULT_PRODUCTS: Record<number, Product[]> = {
  "0": [
    {
      "id": 422,
      "name": "*מבצע* עד חצות  חלב",
      "barcode": "7290000181103",
      "brand": "",
      "minPrice": 11.9,
      "storeCount": 1553,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000181103.jpg"
    },
    {
      "id": 449,
      "name": "פרה קראנצ ביסקוויט שוקולד חלב 100ג",
      "barcode": "7290105363572",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 1545,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/UWR50_Z_P_7290105363572_1.png"
    },
    {
      "id": 456,
      "name": "אנרגי פריכיות תחתית שוקולד חלב 80 ג",
      "barcode": "7290106526822",
      "brand": "",
      "minPrice": 6.9,
      "storeCount": 1470,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2020/09/7290106526822-600.jpg"
    },
    {
      "id": 245,
      "name": "חלב תנובה טרי1ל קרטו",
      "barcode": "7290004131074",
      "brand": "",
      "minPrice": 5.9,
      "storeCount": 1447,
      "imageUrl": "https://img.rami-levy.co.il/product/7290004131074/small.jpg"
    },
    {
      "id": 427,
      "name": "שוקולד קרם חלב מגדים",
      "barcode": "7290003903955",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 1402,
      "imageUrl": "https://img.rami-levy.co.il/product/7290003903955/small.jpg"
    },
    {
      "id": 1175,
      "name": "חלב בבקבוק 3% מועשר-",
      "barcode": "7290107932080",
      "brand": "",
      "minPrice": 7.3,
      "storeCount": 1390,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/YLL48_Z_P_7290107932080_2.png"
    },
    {
      "id": 482,
      "name": "שוקולד חלב שברי אגוז",
      "barcode": "7290110579463",
      "brand": "",
      "minPrice": 7.3,
      "storeCount": 1390,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290110579463-1008486/7290110579463/2025-10-14T00-41-16-118Z.jpg"
    },
    {
      "id": 3996,
      "name": "חלב בבקבוק נטול לקטו",
      "barcode": "7290110563462",
      "brand": "",
      "minPrice": 7.8,
      "storeCount": 1366,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2020/09/7290110563462-600.jpg"
    },
    {
      "id": 1396,
      "name": "קינדר דליס עוגת ספוג קקאו במילוי חל",
      "barcode": "8000500267103",
      "brand": "",
      "minPrice": 18.3,
      "storeCount": 1362,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1131/large/8000500267103.jpg?_a=1675003261322"
    },
    {
      "id": 446,
      "name": "שוקולד חלב במילוי קר",
      "barcode": "7290104724718",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 1347,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290104724718.jpg"
    },
    {
      "id": 186,
      "name": "חלב תנובה טרי קרט+ פ",
      "barcode": "7290000042435",
      "brand": "",
      "minPrice": 5.59,
      "storeCount": 1334,
      "imageUrl": "https://img.rami-levy.co.il/product/7290000042435/small.jpg"
    },
    {
      "id": 1391,
      "name": "קינדר שוקולד חלב ממולא קרם חלב 200 ",
      "barcode": "8000500071083",
      "brand": "",
      "minPrice": 12.3,
      "storeCount": 1328,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/NSM32_Z_P_8000500071083_1.png"
    },
    {
      "id": 414,
      "name": "שוקולד חלב 100 גרם מ",
      "barcode": "7290000170053",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 1325,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290000170053.jpg"
    },
    {
      "id": 1133,
      "name": "חלב 3% בקבוק 2 ליטר",
      "barcode": "7290003029815",
      "brand": "",
      "minPrice": 14.4,
      "storeCount": 1309,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290003029815-1000817/7290003029815/2025-08-27T00-08-43-717Z.jpg"
    },
    {
      "id": 1386,
      "name": "קינדר הפי היפו שוקולד חלב ממולא קרם",
      "barcode": "8000500023624",
      "brand": "",
      "minPrice": 11.9,
      "storeCount": 1302,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/VND30_Z_P_8000500023624_1.png"
    },
    {
      "id": 260,
      "name": "YOLO מעדן שוקולד חלב",
      "barcode": "7290014761056",
      "brand": "",
      "minPrice": 4.4,
      "storeCount": 1299,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290014761056-983480/7290014761056/2025-07-13T23-09-07-386Z.jpg"
    },
    {
      "id": 218,
      "name": "גוש חלב פרוס 200 %28",
      "barcode": "7290004122195",
      "brand": "",
      "minPrice": 12.7,
      "storeCount": 1288,
      "imageUrl": "https://imageproxy.wolt.com/assets/66794735418d9b24855455db"
    },
    {
      "id": 2899,
      "name": "חלב בקרטון 3% 2 ליטר",
      "barcode": "7290102398065",
      "brand": "",
      "minPrice": 11.88,
      "storeCount": 1288,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290102398065.jpg"
    },
    {
      "id": 1389,
      "name": "קינדר בואנו שוקולד חלב שלישייה",
      "barcode": "8000500029350",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 1277,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/8000500029350.jpg"
    },
    {
      "id": 4504,
      "name": "מעדן חלב עם שוקולד מ",
      "barcode": "7290110557102",
      "brand": "",
      "minPrice": 4.4,
      "storeCount": 1275,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1219/large/7290110557102-996152/7290110557102/2025-09-12T11-40-12-647Z.jpg"
    }
  ],
  "1": [
    {
      "id": 1814,
      "name": "תפוציפס לחם שום 50 ג",
      "barcode": "7290119381173",
      "brand": "",
      "minPrice": 2.6,
      "storeCount": 1281,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290119381173-1016824/7290119381173/2025-12-18T11-15-44-809Z.jpg"
    },
    {
      "id": 6842,
      "name": "פסטו ביתי עללחם 180",
      "barcode": "7290015858106",
      "brand": "",
      "minPrice": 13.5,
      "storeCount": 1244,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2020/09/7290015858106-600-1.jpg"
    },
    {
      "id": 366,
      "name": "לחם אחיד פרוס אנגל 9",
      "barcode": "7290018500361",
      "brand": "",
      "minPrice": 7.1,
      "storeCount": 1200,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290018500361-878035/7290018500361/2024-12-26T09-44-33-106Z.jpg"
    },
    {
      "id": 375,
      "name": "מאסטר שף פירורי לחם מוזהבים 320 גרם",
      "barcode": "7290013358356",
      "brand": "",
      "minPrice": 5.8,
      "storeCount": 1188,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290013358356-968279/7290013358356/2025-03-12T09-04-18-375Z.jpg"
    },
    {
      "id": 360,
      "name": "לחם בסגנון אמריקה אנ",
      "barcode": "7290017947105",
      "brand": "",
      "minPrice": 13.6,
      "storeCount": 1159,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290017947105-968079/7290017947105/2024-11-17T13-36-23-624Z.jpg"
    },
    {
      "id": 358,
      "name": "לחם פשוט מלא 750 גרם",
      "barcode": "7290014940901",
      "brand": "",
      "minPrice": 12.6,
      "storeCount": 1158,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290014940901-822916/7290014940901/2023-09-29T21-32-02-012Z.jpg"
    },
    {
      "id": 357,
      "name": "*מבצע* לחם אנגל 100%",
      "barcode": "7290013027399",
      "brand": "",
      "minPrice": 13.2,
      "storeCount": 1033,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/GXK52_L_P_7290013027399_1.png"
    },
    {
      "id": 370,
      "name": "לחם מחמצת כוסמין ארט",
      "barcode": "7290018540817",
      "brand": "",
      "minPrice": 15.9,
      "storeCount": 996,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290018540817.jpg"
    },
    {
      "id": 14465,
      "name": "פירורית פירורי לחם ז",
      "barcode": "7290000067544",
      "brand": "",
      "minPrice": 5.0,
      "storeCount": 909,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000067544.jpg"
    },
    {
      "id": 356,
      "name": "לחם שיפון גרעינים 75",
      "barcode": "7290002065616",
      "brand": "",
      "minPrice": 11.9,
      "storeCount": 879,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2026/02/7290002065616-600.jpg"
    },
    {
      "id": 16673,
      "name": "פירורי לחם מוזהבים ס",
      "barcode": "7290100700075",
      "brand": "",
      "minPrice": 2.6,
      "storeCount": 878,
      "imageUrl": "https://www.carmella.co.il/wp-content/uploads/2019/05/7290100700075.jpg"
    },
    {
      "id": 7541,
      "name": "אריסה חריפה עללחם 25",
      "barcode": "7290017121093",
      "brand": "",
      "minPrice": 11.0,
      "storeCount": 870,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290017121093-1008943/7290017121093/2025-10-20T09-49-30-924Z.jpg"
    },
    {
      "id": 8203,
      "name": "*מבצע* לחם ברמן אקטי",
      "barcode": "7290000497044",
      "brand": "",
      "minPrice": 13.9,
      "storeCount": 813,
      "imageUrl": "https://img.rami-levy.co.il/product/7290000497044/small.jpg"
    },
    {
      "id": 1998,
      "name": "סחוג אדום עללחם 140",
      "barcode": "7290017121895",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 802,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290017121895-961259/7290017121895/2024-09-16T20-13-02-335Z.jpg"
    },
    {
      "id": 5742,
      "name": "לחם עננים בסגנון ברי",
      "barcode": "7290004033736",
      "brand": "",
      "minPrice": 12.9,
      "storeCount": 758,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290004033736-972833/7290004033736/2024-12-08T20-03-11-494Z.jpg"
    },
    {
      "id": 6117,
      "name": "לחם כוסמין מחמצת 700 גר דר מרק",
      "barcode": "7290016867008",
      "brand": "",
      "minPrice": 14.8,
      "storeCount": 676,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290016867008.jpg"
    },
    {
      "id": 1444,
      "name": "לחם כוסמין מחמצת",
      "barcode": "7290016867053",
      "brand": "",
      "minPrice": 16.9,
      "storeCount": 663,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290016867053-934300/7290016867053/2025-01-01T11-49-38-281Z.jpg"
    },
    {
      "id": 1969,
      "name": "סחוג ירוק עללחם 140",
      "barcode": "7290017121000",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 651,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1492/large/7290017121000-961256/7290017121000/2024-09-16T23-27-22-659Z.jpg"
    },
    {
      "id": 8381,
      "name": "איולי פסטו עללחם 295",
      "barcode": "7290015858328",
      "brand": "",
      "minPrice": 10.9,
      "storeCount": 619,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1419/large/7290015858328-997485/7290015858328/2025-11-28T13-24-00-151Z.jpg"
    },
    {
      "id": 4507,
      "name": "לחם מחמצת חיטה מלאה",
      "barcode": "7290018540831",
      "brand": "",
      "minPrice": 16.2,
      "storeCount": 615,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2022/01/7290018540831-1.jpg"
    }
  ],
  "2": [
    {
      "id": 9168,
      "name": "מרק עוף אמיתי 400 גר",
      "barcode": "7290000070308",
      "brand": "",
      "minPrice": 12.7,
      "storeCount": 1330,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000070308.jpg"
    },
    {
      "id": 5604,
      "name": "מרק זך בטעם עוף רכיב",
      "barcode": "7290100685341",
      "brand": "",
      "minPrice": 11.9,
      "storeCount": 1247,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/s/7290100685341.jpg"
    },
    {
      "id": 8239,
      "name": "אבקת מרק טעם עוף 400",
      "barcode": "7290112492999",
      "brand": "",
      "minPrice": 11.8,
      "storeCount": 1230,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/LJK64_L_P_7290112492999_1.png"
    },
    {
      "id": 1549,
      "name": "מרק בטעם עוף זך 400",
      "barcode": "7290100689301",
      "brand": "",
      "minPrice": 7.5,
      "storeCount": 1149,
      "imageUrl": "https://img.rami-levy.co.il/product/7290100689301/small.jpg"
    },
    {
      "id": 597,
      "name": "נמס בכוס+ט.עוף שקדי",
      "barcode": "7290100245231",
      "brand": "",
      "minPrice": 5.1,
      "storeCount": 1117,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290100245231-897227/7290100245231/2023-10-06T08-56-12-796Z.jpg"
    },
    {
      "id": 9299,
      "name": "קנור עוף אמיתי 400ג",
      "barcode": "7290000112619",
      "brand": "",
      "minPrice": 13.6,
      "storeCount": 1098,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000112619.jpg"
    },
    {
      "id": 5602,
      "name": "מרק בטעם עוף 1 ק\"ג",
      "barcode": "7290100685136",
      "brand": "",
      "minPrice": 10.2,
      "storeCount": 1067,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/QCV48_Z_P_7290100685136_1.png"
    },
    {
      "id": 1352,
      "name": "נקניקיות עוף 400 גרם",
      "barcode": "7290000537566",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 1061,
      "imageUrl": "https://www.boaron-market.co.il/images/itempics/7290000537566_25102022184108.jpg"
    },
    {
      "id": 5827,
      "name": "דגש ט.עוף בד\"צ מופחת",
      "barcode": "7290000116204",
      "brand": "",
      "minPrice": 13.3,
      "storeCount": 1038,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/000/011/6204/front_fr.8.400.jpg"
    },
    {
      "id": 11769,
      "name": "נקניקיות עוף 400 ג",
      "barcode": "7290000364872",
      "brand": "",
      "minPrice": 10.0,
      "storeCount": 1009,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290000364872-968228/7290000364872/2025-09-30T14-23-25-356Z.jpg"
    },
    {
      "id": 3923,
      "name": "נקניקיות עוף 1 ק\"ג",
      "barcode": "7290000364858",
      "brand": "",
      "minPrice": 21.9,
      "storeCount": 1007,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/02/7290000364858_Small.jpg"
    },
    {
      "id": 3444,
      "name": "קנור ט.עוף ר.טבעי 40",
      "barcode": "7290107645591",
      "brand": "",
      "minPrice": 15.1,
      "storeCount": 993,
      "imageUrl": "https://www.unileverfoodsolutions.co.il/dam/global-ufs/mcos/ISRAEL/calcmenu/products/IL-products/packshots/foodsolutions/7290107645591.jpg"
    },
    {
      "id": 5603,
      "name": "מרק עוף רכיבים טבעיי",
      "barcode": "7290100685334",
      "brand": "",
      "minPrice": 17.0,
      "storeCount": 989,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_large/QKL48_L_P_7290100685334_1.png"
    },
    {
      "id": 2842,
      "name": "מאסטר שף תבשיל נודלס בטעם עוף 60 גר",
      "barcode": "7290117389300",
      "brand": "",
      "minPrice": 3.4,
      "storeCount": 973,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290117389300.jpg"
    },
    {
      "id": 168,
      "name": "מאמא עוף שניצל אמיתי",
      "barcode": "7290008409551",
      "brand": "",
      "minPrice": 34.9,
      "storeCount": 952,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290008409551-997642/7290008409551/2025-07-23T23-03-16-864Z.jpg"
    },
    {
      "id": 1640,
      "name": "שניצלונים עוף טוב 60",
      "barcode": "7290019205807",
      "brand": "",
      "minPrice": 14.9,
      "storeCount": 938,
      "imageUrl": "https://oftov.co.il/wp-content/uploads/2025/08/7290019205807-scaled.png"
    },
    {
      "id": 25167,
      "name": "מרק טעם עוף זך עדיף אסם (400 גרם)",
      "barcode": "7290000070384",
      "brand": "",
      "minPrice": 7.5,
      "storeCount": 917,
      "imageUrl": "https://sk-m.co.il/wp-content/uploads/2017/10/7290000070384.jpg"
    },
    {
      "id": 6821,
      "name": "נקניקיות עוף 400 גרם",
      "barcode": "7290000319131",
      "brand": "",
      "minPrice": 8.5,
      "storeCount": 916,
      "imageUrl": "https://yehiam.co.il/wp-content/uploads/2022/05/7290000319131_%D7%A0%D7%A7%D7%A0%D7%99%D7%A7%D7%99%D7%95%D7%AA-%D7%A2%D7%95%D7%A3-400-%D7%92%D7%A8%D7%9D.jpg"
    },
    {
      "id": 4093,
      "name": "מאמא עוף כוכבים",
      "barcode": "7290008409605",
      "brand": "",
      "minPrice": 29.7,
      "storeCount": 872,
      "imageUrl": "https://img.rami-levy.co.il/product/7290008409605/small.jpg"
    },
    {
      "id": 598,
      "name": "קנור עוף אמיתי ר.טבע",
      "barcode": "7290107645584",
      "brand": "",
      "minPrice": 21.1,
      "storeCount": 864,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/QQJ58_Z_P_7290107645584_1.png"
    }
  ],
  "3": [
    {
      "id": 6367,
      "name": "שמן חמניות בריאות מה",
      "barcode": "7290000144467",
      "brand": "",
      "minPrice": 11.1,
      "storeCount": 1179,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1131/large/7290000144467-875300/7290000144467/2023-07-20T17-13-29-999Z.jpg"
    },
    {
      "id": 434,
      "name": "שמן זית 2 קלאסי 750",
      "barcode": "7290010429554",
      "brand": "",
      "minPrice": 33.8,
      "storeCount": 1082,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290010429554-922224/7290010429554/2025-02-18T11-24-54-507Z.jpg"
    },
    {
      "id": 530,
      "name": "לאבנה שמן זית זעתר",
      "barcode": "7290000554686",
      "brand": "",
      "minPrice": 13.6,
      "storeCount": 1065,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2023/11/7290000554686-600.jpg"
    },
    {
      "id": 5339,
      "name": "פינוק תחליב רחצה 700 בתוספת שמן מרו",
      "barcode": "7290112499455",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 1035,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/UXS58_Z_P_7290112499455_1.png"
    },
    {
      "id": 5981,
      "name": "סנו גל לניקוי כללי על בסיס שמן אורנ",
      "barcode": "7290000292533",
      "brand": "",
      "minPrice": 14.3,
      "storeCount": 1007,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290000292533.jpg"
    },
    {
      "id": 878,
      "name": "ס.ק  טונה בשמן 160גר",
      "barcode": "7290005287206",
      "brand": "",
      "minPrice": 18.9,
      "storeCount": 936,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290005287206-897538/7290005287206/2025-03-17T15-08-32-023Z.jpg"
    },
    {
      "id": 6369,
      "name": "*מבצע* תרסיס שמן קנו",
      "barcode": "7290002692768",
      "brand": "",
      "minPrice": 11.7,
      "storeCount": 915,
      "imageUrl": "https://tzahile.co.il/wp-content/uploads/2023/01/7290002692768.jpg"
    },
    {
      "id": 5322,
      "name": "פינוק מרכך בתוספת שמן מרוקאי 700 מל",
      "barcode": "7290112499448",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 915,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290112499448.jpg"
    },
    {
      "id": 13453,
      "name": "תרסיס שמן זית",
      "barcode": "64144090020",
      "brand": "",
      "minPrice": 15.4,
      "storeCount": 907,
      "imageUrl": "https://www.carmella.co.il/wp-content/uploads/2023/04/64144090020-.jpg"
    },
    {
      "id": 626,
      "name": "שמן קנולה בריאות מהט",
      "barcode": "7290000144474",
      "brand": "",
      "minPrice": 11.6,
      "storeCount": 882,
      "imageUrl": "https://supersabri.b1.market/wp-content/uploads/sites/2/2022/11/7290000144474.jpg"
    },
    {
      "id": 10140,
      "name": "לאבנה שמן זית וזעתר",
      "barcode": "7290106664067",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 874,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290106664067-947670/7290106664067/2025-02-19T21-52-13-515Z.jpg"
    },
    {
      "id": 6972,
      "name": "תרסיס שמן זית  150 מ",
      "barcode": "7290107956642",
      "brand": "",
      "minPrice": 14.4,
      "storeCount": 844,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290107956642-1006613/7290107956642/2025-08-26T05-18-25-713Z.jpg"
    },
    {
      "id": 13440,
      "name": "שמן קנולה בריאות עץ",
      "barcode": "7290000243566",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 825,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000243566.jpg"
    },
    {
      "id": 1289,
      "name": "טונה רביעייה בשמן",
      "barcode": "7290015039246",
      "brand": "",
      "minPrice": 17.8,
      "storeCount": 824,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290015039246-957176/7290015039246/2024-07-09T19-50-03-207Z.jpg"
    },
    {
      "id": 13087,
      "name": "שמן קנולה מועשר \"עץ",
      "barcode": "7290002692393",
      "brand": "",
      "minPrice": 11.9,
      "storeCount": 821,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290002692393-855207/7290002692393/2023-09-04T08-04-13-340Z.jpg"
    },
    {
      "id": 6929,
      "name": "טונה סטארקיסט בשמן ז",
      "barcode": "7290013847645",
      "brand": "",
      "minPrice": 14.9,
      "storeCount": 818,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1219/large/7290013847645-983123/7290013847645/2025-03-13T08-54-03-569Z.jpg"
    },
    {
      "id": 7729,
      "name": "שמן קנולה בריאות מהט",
      "barcode": "7290002374640",
      "brand": "",
      "minPrice": 12.9,
      "storeCount": 800,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290002374640-855206/7290002374640/2023-09-04T07-53-52-284Z.jpg"
    },
    {
      "id": 733,
      "name": "טונה ויליגר בשמן 4*1",
      "barcode": "7290002929642",
      "brand": "",
      "minPrice": 15.3,
      "storeCount": 797,
      "imageUrl": "https://neto.org.il/wp-content/uploads/2025/03/7290002929642.jpg"
    },
    {
      "id": 10461,
      "name": "סנו נוזל מרוכז לניקוי כללי עם שמן א",
      "barcode": "7290108358155",
      "brand": "",
      "minPrice": 14.3,
      "storeCount": 796,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290108358155.jpg"
    },
    {
      "id": 509,
      "name": "שמן זית לחיץ 280 מ\"ל",
      "barcode": "7290119379200",
      "brand": "",
      "minPrice": 12.7,
      "storeCount": 787,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/medium/7290119379200-962660/7290119379200/2025-04-09T01-49-31-978Z.jpg"
    }
  ],
  "4": [
    {
      "id": 629,
      "name": "אורז פרסי סוגת 1 ק\"ג",
      "barcode": "7290000211442",
      "brand": "",
      "minPrice": 9.9,
      "storeCount": 1412,
      "imageUrl": "https://www.carmella.co.il/wp-content/uploads/2019/05/7290000211442.jpg"
    },
    {
      "id": 637,
      "name": "אורז בסמטי סוגת 1 ק\"",
      "barcode": "7290003643004",
      "brand": "",
      "minPrice": 12.4,
      "storeCount": 1390,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2024/07/7290003643004-600.jpg"
    },
    {
      "id": 1545,
      "name": "פריכונים מאורז מלא א",
      "barcode": "7290000068343",
      "brand": "",
      "minPrice": 5.9,
      "storeCount": 1344,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1254/large/7290000068343-981481/7290000068343/2025-03-27T09-54-39-142Z.jpg"
    },
    {
      "id": 652,
      "name": "אורז יסמין סוגת 1 ק\"",
      "barcode": "7290100700396",
      "brand": "",
      "minPrice": 10.1,
      "storeCount": 1326,
      "imageUrl": "https://www.carmella.co.il/wp-content/uploads/2019/05/7290100700396.jpg"
    },
    {
      "id": 631,
      "name": "אורז עגול 1 ק\"ג",
      "barcode": "7290000211985",
      "brand": "",
      "minPrice": 9.2,
      "storeCount": 1291,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290000211985-200670/7290000211985/2023-09-04T11-02-24-707Z.jpg"
    },
    {
      "id": 627,
      "name": "אורז תאילנדי 1 קג",
      "barcode": "7290000211169",
      "brand": "",
      "minPrice": 3.9,
      "storeCount": 1262,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290000211169-159481/7290000211169/2023-09-04T11-02-24-345Z.jpg"
    },
    {
      "id": 1531,
      "name": "פתיתים אורז אסם 500",
      "barcode": "7290000060903",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 1252,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000060903.jpg"
    },
    {
      "id": 6543,
      "name": "אורז בסמטי דאווט 1 ק",
      "barcode": "8901537024014",
      "brand": "",
      "minPrice": 9.9,
      "storeCount": 1158,
      "imageUrl": "https://images.openfoodfacts.org/images/products/890/153/702/4014/front_en.31.400.jpg"
    },
    {
      "id": 5495,
      "name": "חטיפי פריכונים אורז",
      "barcode": "7290000078762",
      "brand": "",
      "minPrice": 6.9,
      "storeCount": 1147,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000078762.jpg"
    },
    {
      "id": 486,
      "name": "פריכיות חומוס אורז ע",
      "barcode": "7290112335500",
      "brand": "",
      "minPrice": 9.3,
      "storeCount": 1126,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/011/233/5500/front_en.3.400.jpg"
    },
    {
      "id": 822,
      "name": "*מבצע* אורז פרסי דוו",
      "barcode": "7290108509700",
      "brand": "",
      "minPrice": 8.4,
      "storeCount": 962,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/UXP48_Z_P_7290108509700_1.png"
    },
    {
      "id": 10385,
      "name": "צ'יפס אורז בטעם זעתר",
      "barcode": "7290119384549",
      "brand": "",
      "minPrice": 4.2,
      "storeCount": 932,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290119384549-1013375/7290119384549/2025-11-16T11-38-34-646Z.jpg"
    },
    {
      "id": 7482,
      "name": "בייבי ביס הוט קידס נגיסי אורז לתינו",
      "barcode": "7290011618025",
      "brand": "",
      "minPrice": 10.0,
      "storeCount": 926,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290011618025.jpg"
    },
    {
      "id": 2975,
      "name": "נודלס אטריות אורז רח",
      "barcode": "7290111568275",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 878,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/VLC54_Z_P_7290111568275_1.png"
    },
    {
      "id": 829,
      "name": "*מבצע* אורז בסמטי טי",
      "barcode": "5011157630281",
      "brand": "",
      "minPrice": 14.0,
      "storeCount": 853,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/RIW40_Z_P_5011157630281_1.png"
    },
    {
      "id": 5904,
      "name": "אורז סושי 1 ק\"ג",
      "barcode": "7290100701157",
      "brand": "",
      "minPrice": 9.9,
      "storeCount": 825,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/NVA40_Z_P_7290100701157_1.png"
    },
    {
      "id": 628,
      "name": "אורז מלא 1 ק\"ג.",
      "barcode": "7290000211312",
      "brand": "",
      "minPrice": 7.6,
      "storeCount": 796,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1540/large/7290000211312-200668/7290000211312/2024-02-16T22-17-08-362Z.jpg"
    },
    {
      "id": 5907,
      "name": "פתיתים אפויים אורז 5",
      "barcode": "7290100702611",
      "brand": "",
      "minPrice": 4.9,
      "storeCount": 790,
      "imageUrl": "https://www.rami-levy.co.il/_ipx/w_366,f_webp/https://img.rami-levy.co.il/product/7290100702611/small.jpg"
    },
    {
      "id": 5901,
      "name": "אורז בסמטי מלא 1 ק\"ג",
      "barcode": "7290100700372",
      "brand": "",
      "minPrice": 12.6,
      "storeCount": 785,
      "imageUrl": "https://www.rami-levy.co.il/_ipx/w_366,f_webp/https://img.rami-levy.co.il/product/7290100700372/small.jpg"
    },
    {
      "id": 14023,
      "name": "מנה חמה ווק אורז בסג",
      "barcode": "7290118427667",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 780,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/011/842/7667/front_en.3.400.jpg"
    }
  ],
  "5": [
    {
      "id": 128,
      "name": "קוקה קולה פחית 330 מל",
      "barcode": "7290011017866",
      "brand": "",
      "minPrice": 3.4,
      "storeCount": 1413,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290011017866.jpg"
    },
    {
      "id": 126,
      "name": "קולה ZERO בקבוק 0.5 מל",
      "barcode": "7290008909853",
      "brand": "",
      "minPrice": 2.9,
      "storeCount": 1390,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290008909853.jpg"
    },
    {
      "id": 123,
      "name": "קולה 0.5 חייב פקדון",
      "barcode": "7290001594155",
      "brand": "",
      "minPrice": 2.9,
      "storeCount": 1331,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290001594155.jpg"
    },
    {
      "id": 130,
      "name": "קוקה קולה פרידג פק מארז שישיה",
      "barcode": "7290011018832",
      "brand": "",
      "minPrice": 17.8,
      "storeCount": 1310,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/ZQV42_Z_P_7290011018832_1.png"
    },
    {
      "id": 148,
      "name": "קוקה קולה שישייה 1.5",
      "barcode": "7290110115364",
      "brand": "",
      "minPrice": 37.7,
      "storeCount": 1283,
      "imageUrl": "https://www.banamashkaot.co.il/wp-content/uploads/2025/06/7290110115364.png"
    },
    {
      "id": 150,
      "name": "קוקה קולה זירו שישיי",
      "barcode": "7290110115418",
      "brand": "",
      "minPrice": 38.6,
      "storeCount": 1033,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/EFZ40_Z_P_7290110115418_1.png"
    },
    {
      "id": 132,
      "name": "קוקה קולה זירו 1 ליט",
      "barcode": "7290013585387",
      "brand": "",
      "minPrice": 5.6,
      "storeCount": 1010,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290013585387-956362/7290013585387/2025-09-11T10-07-59-753Z.jpg"
    },
    {
      "id": 4885,
      "name": "פפסי קולה 1.5 ליטר",
      "barcode": "7290000136141",
      "brand": "",
      "minPrice": 5.3,
      "storeCount": 944,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290000136141-947805/7290000136141/2025-10-05T11-05-44-843Z.jpg"
    },
    {
      "id": 1722,
      "name": "קוקה קולה 1.5 ליטר",
      "barcode": "7290110115845",
      "brand": "",
      "minPrice": 6.5,
      "storeCount": 866,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/011/011/5845/front_iw.4.400.jpg"
    },
    {
      "id": 145,
      "name": "קוקה קולה 1.5 ליטר פיקדון",
      "barcode": "7290110115203",
      "brand": "",
      "minPrice": 6.8,
      "storeCount": 849,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/011/011/5203/front_en.6.400.jpg"
    },
    {
      "id": 1687,
      "name": "אגוזי מלך קלופים 150 גר` ששון הקולה",
      "barcode": "7290014094895",
      "brand": "",
      "minPrice": 8.0,
      "storeCount": 718,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290014094895-967188/7290014094895/2024-12-05T08-00-58-515Z.jpg"
    },
    {
      "id": 14523,
      "name": "קוקה קולה שישייה 1.5",
      "barcode": "7290110116316",
      "brand": "",
      "minPrice": 34.4,
      "storeCount": 713,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1540/large/7290110116316-1022085/7290110116316/2026-01-29T00-02-08-843Z.jpg"
    },
    {
      "id": 13891,
      "name": "קוקה קולה בקבוק זכוכית 350 מל החברה",
      "barcode": "7290001594025",
      "brand": "",
      "minPrice": 3.9,
      "storeCount": 679,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/000/159/4025/front_en.7.400.jpg"
    },
    {
      "id": 13543,
      "name": "שקד טבעי 150 גרם ששון הקולה",
      "barcode": "7290019297628",
      "brand": "",
      "minPrice": 11.9,
      "storeCount": 598,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290019297628-967198/7290019297628/2024-12-10T07-24-54-355Z.jpg"
    },
    {
      "id": 10738,
      "name": "קוקה קולה זירו שישיי",
      "barcode": "7290110116323",
      "brand": "",
      "minPrice": 34.4,
      "storeCount": 553,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290110116323-1022087/7290110116323/2026-01-28T13-47-06-442Z.jpg"
    },
    {
      "id": 1766,
      "name": "צימוק חום 300 גר ששון הקולה",
      "barcode": "7290014094840",
      "brand": "",
      "minPrice": 9.9,
      "storeCount": 516,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290014094840-972800/7290014094840/2024-12-10T07-48-54-715Z.jpg"
    },
    {
      "id": 25252,
      "name": "בננה צ`יפס 200 גר` מסוכר ששון הקולה",
      "barcode": "7290005686405",
      "brand": "",
      "minPrice": 5.9,
      "storeCount": 505,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290005686405-699761/7290005686405/2025-01-02T20-51-21-564Z.jpg"
    },
    {
      "id": 13892,
      "name": "קוקה קולה ZERO קלאסי 350 מל",
      "barcode": "7290008909884",
      "brand": "",
      "minPrice": 5.3,
      "storeCount": 500,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/000/890/9884/front_fr.5.400.jpg"
    },
    {
      "id": 8326,
      "name": "RC קולה שישייה 1.5 ל",
      "barcode": "7290019056461",
      "brand": "",
      "minPrice": 19.9,
      "storeCount": 487,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1107/large/7290019056461-884046/7290019056461/2025-03-09T12-16-52-625Z.jpg"
    },
    {
      "id": 15078,
      "name": "קוקה קולה זירו פרידג פק מארז שישיה",
      "barcode": "7290011018917",
      "brand": "",
      "minPrice": 16.9,
      "storeCount": 453,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/ZUC46_Z_P_7290011018917_2.png"
    }
  ],
  "6": [
    {
      "id": 5607,
      "name": "במבה במילוי נוגט 60 גרם",
      "barcode": "7290100687109",
      "brand": "",
      "minPrice": 3.5,
      "storeCount": 1599,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/30/large/7290100687109-1004820/7290100687109/2025-08-15T11-13-41-414Z.jpg"
    },
    {
      "id": 5462,
      "name": "במבה מתוקה מחומרים ט",
      "barcode": "7290000066295",
      "brand": "",
      "minPrice": 2.1,
      "storeCount": 1364,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290000066295-1003643/7290000066295/2025-08-14T07-25-29-545Z.jpg"
    },
    {
      "id": 1843,
      "name": "במבה מאנצ ברביקיו 60 גרם",
      "barcode": "7290118427223",
      "brand": "",
      "minPrice": 3.5,
      "storeCount": 1277,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290118427223.jpg"
    },
    {
      "id": 7571,
      "name": "במבה מארז 10*25 גרם",
      "barcode": "7290105693341",
      "brand": "",
      "minPrice": 12.1,
      "storeCount": 1246,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290105693341-1003805/7290105693341/2025-08-14T22-12-24-726Z.jpg"
    },
    {
      "id": 1552,
      "name": "במבה קלאסי 200 גרם",
      "barcode": "7290104508943",
      "brand": "",
      "minPrice": 7.5,
      "storeCount": 1227,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290104508943-998788/7290104508943/2025-08-03T18-21-43-635Z.jpg"
    },
    {
      "id": 1841,
      "name": "במבה מאנצ' צ'דר אסם",
      "barcode": "7290115201949",
      "brand": "",
      "minPrice": 3.5,
      "storeCount": 1135,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290115201949-1019923/7290115201949/2026-01-08T04-33-06-791Z.jpg"
    },
    {
      "id": 5463,
      "name": "במבה 80 גרם",
      "barcode": "7290000066318",
      "brand": "",
      "minPrice": 3.1,
      "storeCount": 1119,
      "imageUrl": "https://guluten.b1.market/wp-content/uploads/sites/2/2022/11/7290000066318.jpg"
    },
    {
      "id": 3085,
      "name": "במבה במילוי וופל בלגי 60 גרם",
      "barcode": "7290118424062",
      "brand": "",
      "minPrice": 3.8,
      "storeCount": 1094,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290118424062.jpg"
    },
    {
      "id": 1563,
      "name": "במבה במילוי נוגט מאר",
      "barcode": "7290107877619",
      "brand": "",
      "minPrice": 9.9,
      "storeCount": 1084,
      "imageUrl": "https://schnellers.co.il/wp-content/uploads/2025/03/7290107877619.jpg"
    },
    {
      "id": 5478,
      "name": "במבה במילוי קרם חלבה",
      "barcode": "7290000072067",
      "brand": "",
      "minPrice": 3.8,
      "storeCount": 972,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2021/02/7290000072067.jpg"
    },
    {
      "id": 5474,
      "name": "במבה יום הולדת 80 גרם",
      "barcode": "7290000068770",
      "brand": "",
      "minPrice": 3.1,
      "storeCount": 957,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290000068770.jpg"
    },
    {
      "id": 5536,
      "name": "במבה יום הולדת 15 גר",
      "barcode": "7290006652027",
      "brand": "",
      "minPrice": 19.9,
      "storeCount": 929,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290006652027.jpg"
    },
    {
      "id": 1587,
      "name": "במבה ביסלי גריל מיקס",
      "barcode": "7290118426202",
      "brand": "",
      "minPrice": 3.8,
      "storeCount": 910,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290118426202-999767/7290118426202/2025-08-04T03-24-24-399Z.jpg"
    },
    {
      "id": 8303,
      "name": "פופקו במבה 80 גרם",
      "barcode": "7290115203134",
      "brand": "",
      "minPrice": 3.8,
      "storeCount": 869,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/QLJ38_Z_P_7290115203134_1.png"
    },
    {
      "id": 3946,
      "name": "מארז במבה קלאסי אחיד",
      "barcode": "7290118428374",
      "brand": "",
      "minPrice": 12.2,
      "storeCount": 836,
      "imageUrl": "https://img.rami-levy.co.il/product/7290118428374/small.jpg"
    },
    {
      "id": 8615,
      "name": "במבה מאנצ' ברביקיו א",
      "barcode": "7290118428350",
      "brand": "",
      "minPrice": 7.5,
      "storeCount": 812,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290118428350-1019933/7290118428350/2026-01-08T04-33-11-847Z.jpg"
    },
    {
      "id": 13526,
      "name": "במבה יום הולדת 25 גר",
      "barcode": "7290000068787",
      "brand": "",
      "minPrice": 2.0,
      "storeCount": 768,
      "imageUrl": "https://img.rami-levy.co.il/product/7290000068787/small.jpg"
    },
    {
      "id": 744629,
      "name": "במבה פירמידות 70 גרם",
      "barcode": "7290122781724",
      "brand": "",
      "minPrice": 3.4,
      "storeCount": 765,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290122781724-1022009/7290122781724/2026-01-30T02-43-33-010Z.jpg"
    },
    {
      "id": 2517,
      "name": "במבה PRO חלבון 80 גרם",
      "barcode": "7290115203172",
      "brand": "",
      "minPrice": 3.8,
      "storeCount": 739,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290115203172-999358/7290115203172/2025-08-03T18-26-28-311Z.jpg"
    },
    {
      "id": 8635,
      "name": "במבה מאנצ' צ'דר אסם",
      "barcode": "7290122780079",
      "brand": "",
      "minPrice": 7.5,
      "storeCount": 732,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/SYI54_Z_P_7290122780079_1.png"
    }
  ],
  "7": [
    {
      "id": 237,
      "name": "גבינה לבנה 5% 500 גר",
      "barcode": "7290004127800",
      "brand": "",
      "minPrice": 9.5,
      "storeCount": 1362,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290004127800.jpg"
    },
    {
      "id": 71,
      "name": "גבינה לבנה 250 גרם 5",
      "barcode": "7290000474502",
      "brand": "",
      "minPrice": 4.7,
      "storeCount": 1299,
      "imageUrl": "https://schnellers.co.il/wp-content/uploads/2025/03/7290000474502.jpg"
    },
    {
      "id": 194,
      "name": "גבינה לבנה 5% 250 גר",
      "barcode": "7290000048185",
      "brand": "",
      "minPrice": 4.75,
      "storeCount": 1287,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQsscv8a2UVg5IMS_8WE30Kv64fToQ7nPaYyw&s"
    },
    {
      "id": 3886,
      "name": "בורקס גבינה 800 גרם",
      "barcode": "7290000238173",
      "brand": "",
      "minPrice": 17.3,
      "storeCount": 1277,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/02/7290000238173_Small.jpg"
    },
    {
      "id": 195,
      "name": "גבינה לבנה 9% 250 גר",
      "barcode": "7290000048192",
      "brand": "",
      "minPrice": 4.8,
      "storeCount": 1233,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290000048192-828994/7290000048192/2023-08-16T18-03-06-264Z.jpg"
    },
    {
      "id": 1139,
      "name": "רביולי גבינה 400 EAT",
      "barcode": "7290003989539",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 1228,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2020/09/7290003989539-600-NEW.jpg"
    },
    {
      "id": 174,
      "name": "חטיפי פיצה גבינה",
      "barcode": "7290018091531",
      "brand": "",
      "minPrice": 25.1,
      "storeCount": 1221,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/02/7290018091531_Small.jpg"
    },
    {
      "id": 238,
      "name": "גבינה לבנה 9% 500 גר",
      "barcode": "7290004127817",
      "brand": "",
      "minPrice": 9.1,
      "storeCount": 1199,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290004127817.jpg"
    },
    {
      "id": 243,
      "name": "גבינה לבנה 3% 250 גר",
      "barcode": "7290004129545",
      "brand": "",
      "minPrice": 4.8,
      "storeCount": 1141,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/03/7290004129545_Small.jpg"
    },
    {
      "id": 99,
      "name": "גבינה מותכת 100 גרם",
      "barcode": "7290102397891",
      "brand": "",
      "minPrice": 7.0,
      "storeCount": 1123,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290102397891-1013766/7290102397891/2026-02-13T02-57-15-444Z.jpg"
    },
    {
      "id": 239,
      "name": "גבינה לבנה 5% 750 גר",
      "barcode": "7290004127862",
      "brand": "",
      "minPrice": 14.25,
      "storeCount": 1008,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/03/7290004127862_Small.jpg"
    },
    {
      "id": 797,
      "name": "ציטוס גבינה 80 גר",
      "barcode": "7290106720626",
      "brand": "",
      "minPrice": 3.5,
      "storeCount": 994,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/AJB48_Z_P_7290106720626_1.png"
    },
    {
      "id": 1851,
      "name": "גבינה לבנה 5% עם זית",
      "barcode": "7290000056272",
      "brand": "",
      "minPrice": 5.7,
      "storeCount": 988,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/02/7290000056272_Small.jpg"
    },
    {
      "id": 284,
      "name": "פרוסות גבינה סקנדינב",
      "barcode": "7290110326333",
      "brand": "",
      "minPrice": 14.9,
      "storeCount": 941,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/011/032/6333/front_en.3.400.jpg"
    },
    {
      "id": 193,
      "name": "גבינה לבנה 9% 250 גר",
      "barcode": "7290000047942",
      "brand": "",
      "minPrice": 4.8,
      "storeCount": 940,
      "imageUrl": "https://www.rami-levy.co.il/_ipx/w_366,f_webp/https://img.rami-levy.co.il/product/7290000047942/small.jpg"
    },
    {
      "id": 191,
      "name": "כנען גבינה לבנה 5% 5",
      "barcode": "7290000047546",
      "brand": "",
      "minPrice": 22.6,
      "storeCount": 940,
      "imageUrl": "https://images.openfoodfacts.org/images/products/729/000/004/7546/front_en.6.400.jpg"
    },
    {
      "id": 77,
      "name": "טבורוג - גבינה לאפיי",
      "barcode": "7290002107965",
      "brand": "",
      "minPrice": 21.1,
      "storeCount": 937,
      "imageUrl": "https://www.rami-levy.co.il/_ipx/w_366,f_webp/https://img.rami-levy.co.il/product/7290002107965/small.jpg"
    },
    {
      "id": 192,
      "name": "גבינה לבנה 5% 250 גר",
      "barcode": "7290000047621",
      "brand": "",
      "minPrice": 4.75,
      "storeCount": 925,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/02/7290000047621_Small.jpg"
    },
    {
      "id": 80,
      "name": "גבינה לבנה 500 גרם 5",
      "barcode": "7290010945481",
      "brand": "",
      "minPrice": 9.5,
      "storeCount": 906,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/VDQ50_Z_P_7290010945481_1.png"
    },
    {
      "id": 86,
      "name": "גבינה לבנה 750 גרם 5",
      "barcode": "7290102393268",
      "brand": "",
      "minPrice": 14.25,
      "storeCount": 899,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/UYF52_Z_P_7290102393268_1.png"
    }
  ],
  "8": [
    {
      "id": 1448,
      "name": "ביצים 12 יח גדול",
      "barcode": "7290001201589",
      "brand": "",
      "minPrice": 11.3,
      "storeCount": 813,
      "imageUrl": "https://img.rami-levy.co.il/product/7290001201589/361918/medium.jpg"
    },
    {
      "id": 1449,
      "name": "ביצים 12 יח בינוני",
      "barcode": "7290001201596",
      "brand": "",
      "minPrice": 10.4,
      "storeCount": 800,
      "imageUrl": "https://img.rami-levy.co.il/product/7290001201596/361919/medium.jpg"
    },
    {
      "id": 46072,
      "name": "מצות ביצים 300 גרם ראשון",
      "barcode": "830296000060",
      "brand": "",
      "minPrice": 12.7,
      "storeCount": 603,
      "imageUrl": "https://images.openfoodfacts.org/images/products/083/029/600/0060/front_fr.4.400.jpg"
    },
    {
      "id": 13714,
      "name": "נודלס ביצים להקצפה 200 גר וילי פוד",
      "barcode": "7290010259359",
      "brand": "",
      "minPrice": 3.4,
      "storeCount": 576,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290010259359-939146/7290010259359/2024-03-27T02-06-00-024Z.jpg"
    },
    {
      "id": 8036,
      "name": "אטריות ביצים 454 גרם",
      "barcode": "7290015603188",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 549,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290015603188-703548/7290015603188/2025-11-06T13-23-08-291Z.jpg"
    },
    {
      "id": 5812,
      "name": "אטריות ביצים פטוצ'ינ",
      "barcode": "7290016865943",
      "brand": "",
      "minPrice": 12.6,
      "storeCount": 481,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290016865943-231908/7290016865943/2025-05-22T12-11-58-588Z.jpg"
    },
    {
      "id": 5975,
      "name": "ביצים 18 יח גדול",
      "barcode": "7290001201602",
      "brand": "",
      "minPrice": 16.95,
      "storeCount": 452,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201602.jpg"
    },
    {
      "id": 182842,
      "name": "מצה עשירה ביצים 300",
      "barcode": "96086000065",
      "brand": "",
      "minPrice": 21.6,
      "storeCount": 451,
      "imageUrl": "https://images.openfoodfacts.org/images/products/009/608/600/0065/front_fr.4.400.jpg"
    },
    {
      "id": 14599,
      "name": "אטריות ביצים דקות 10",
      "barcode": "7290002053095",
      "brand": "",
      "minPrice": 7.4,
      "storeCount": 426,
      "imageUrl": "https://bigstore-online.co.il/wp-content/uploads/2024/06/7290002053095.jpg"
    },
    {
      "id": 2918,
      "name": "אטריות ביצים דקות 40",
      "barcode": "7290018860984",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 422,
      "imageUrl": "https://www.carmella.co.il/wp-content/uploads/2024/02/7290018860984.jpg"
    },
    {
      "id": 1783,
      "name": "ביצים אומגה 12 יח גד",
      "barcode": "7290001201855",
      "brand": "",
      "minPrice": 16.9,
      "storeCount": 418,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201855.jpg"
    },
    {
      "id": 189037,
      "name": "ביצים אומגה 12 יח`M",
      "barcode": "7290001201893",
      "brand": "",
      "minPrice": 17.9,
      "storeCount": 411,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201855.jpg"
    },
    {
      "id": 6019,
      "name": "ביצים 18 יח בינוני",
      "barcode": "7290001201619",
      "brand": "",
      "minPrice": 15.6,
      "storeCount": 409,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290001201619.jpg"
    },
    {
      "id": 12731,
      "name": "אטריות ביצים עבות 340 גר מאסטר שף",
      "barcode": "7290117383070",
      "brand": "",
      "minPrice": 7.3,
      "storeCount": 402,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290117383070-922382/7290117383070/2023-09-28T23-19-19-061Z.jpg"
    },
    {
      "id": 2938,
      "name": "אטריות ביצים רחבות 4",
      "barcode": "7290018860991",
      "brand": "",
      "minPrice": 7.9,
      "storeCount": 393,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2024/01/7290018860991-600.jpg"
    },
    {
      "id": 2523,
      "name": "נודלס אטריות ביצים ר",
      "barcode": "7290118427520",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 393,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290118427520-986379/7290118427520/2025-04-08T08-48-54-009Z.jpg"
    },
    {
      "id": 18638,
      "name": "נודלס ביצים 400 גר מאסטר שף",
      "barcode": "7290013358585",
      "brand": "",
      "minPrice": 7.1,
      "storeCount": 388,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290013358585.jpg"
    },
    {
      "id": 2537,
      "name": "נודלס אטריות ביצים",
      "barcode": "7290118427544",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 382,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1184/large/7290118427544-986377/7290118427544/2025-04-09T03-48-56-539Z.jpg"
    },
    {
      "id": 28847,
      "name": "אטריות ביצים 454 גר טעמי אסיה",
      "barcode": "7290011996031",
      "brand": "",
      "minPrice": 6.99,
      "storeCount": 377,
      "imageUrl": "https://www.eastwest-stores.co.il/images/com_hikashop/upload/7290011996031.jpg"
    },
    {
      "id": 13312,
      "name": "סלט ביצים 200 גרם",
      "barcode": "7290015282611",
      "brand": "",
      "minPrice": 12.9,
      "storeCount": 375,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290015282611.jpg"
    }
  ],
  "9": [
    {
      "id": 440,
      "name": "קפסולות קפה עשיר וארומטי 14",
      "barcode": "7290101551027",
      "brand": "",
      "minPrice": 11.0,
      "storeCount": 1468,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290101551027.jpg"
    },
    {
      "id": 494,
      "name": "קפסולות קפה העוצמתי ביותר 15",
      "barcode": "7290112350312",
      "brand": "",
      "minPrice": 11.0,
      "storeCount": 1409,
      "imageUrl": "https://www.rozenfeld.co.il/wp-content/uploads/2021/07/7290112350312.png"
    },
    {
      "id": 419,
      "name": "קפה נמס עלית 200 גרם",
      "barcode": "7290000176420",
      "brand": "",
      "minPrice": 19.9,
      "storeCount": 1399,
      "imageUrl": "https://price-api.additlist.com/images/catalog/carrefour/7290000176420.jpg"
    },
    {
      "id": 1134,
      "name": "אייס קפה 1 ליטר",
      "barcode": "7290003029907",
      "brand": "",
      "minPrice": 10.2,
      "storeCount": 1372,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1492/large/7290003029907-1017855/7290003029907/2025-12-17T06-38-35-814Z.jpg"
    },
    {
      "id": 283,
      "name": "תנובה גו אייס קפה 34",
      "barcode": "7290110325893",
      "brand": "",
      "minPrice": 7.0,
      "storeCount": 1338,
      "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcT2OHhSR-EZCrMlGCHnVjLP14U6xflRUI9mBw&s"
    },
    {
      "id": 9766,
      "name": "אייס קפה 350 מ\"ל",
      "barcode": "7290011438142",
      "brand": "",
      "minPrice": 5.0,
      "storeCount": 1321,
      "imageUrl": "https://josephs.market/wp-content/uploads/2024/08/7290011438142.png"
    },
    {
      "id": 10188,
      "name": "קפסולות קפה גואטמלה 11",
      "barcode": "7290107937856",
      "brand": "",
      "minPrice": 13.9,
      "storeCount": 1273,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290107937856.jpg"
    },
    {
      "id": 14710,
      "name": "קפה טורקי שקית 200 ג",
      "barcode": "7290005201882",
      "brand": "",
      "minPrice": 13.6,
      "storeCount": 1264,
      "imageUrl": "https://www.pizohaizion.co.il/wp-content/uploads/2020/12/7290005201882.jpg"
    },
    {
      "id": 447,
      "name": "קפסולות קפה עשיר וארומטי 9",
      "barcode": "7290105360250",
      "brand": "",
      "minPrice": 11.0,
      "storeCount": 1260,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290105360250.jpg"
    },
    {
      "id": 1178,
      "name": "יטבתה פרו קפה 350",
      "barcode": "7290107954976",
      "brand": "",
      "minPrice": 5.9,
      "storeCount": 1245,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290107954976-1012611/7290107954976/2025-11-07T05-42-07-274Z.jpg"
    },
    {
      "id": 313,
      "name": "משקה חלב לקפה תנובה",
      "barcode": "7290116935416",
      "brand": "",
      "minPrice": 6.6,
      "storeCount": 1199,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290116935416-1017692/7290116935416/2025-12-16T11-19-32-502Z.jpg"
    },
    {
      "id": 1535,
      "name": "נס קפה רד מאג 200 גר",
      "barcode": "7290000061764",
      "brand": "",
      "minPrice": 16.2,
      "storeCount": 1191,
      "imageUrl": "https://shop.nestle-coffee.co.il/cdn/shop/files/12329674_7290000061764_1200x1200_crop_center.png?v=1718712228"
    },
    {
      "id": 1193,
      "name": "יטבתה פרו קפה ללא סו",
      "barcode": "7290110577254",
      "brand": "",
      "minPrice": 5.9,
      "storeCount": 1187,
      "imageUrl": "https://noyhasade.b-cdn.net/wp-content/uploads/2023/01/7290110577254-600-1.jpg"
    },
    {
      "id": 473,
      "name": "קפסולות קפה בטעם אגוזי לוז",
      "barcode": "7290107956901",
      "brand": "",
      "minPrice": 11.0,
      "storeCount": 1183,
      "imageUrl": "https://superpharmstorage.blob.core.windows.net/hybris/products/mobile/medium/7290107956901.jpg"
    },
    {
      "id": 301,
      "name": "גו משקה חלב בטעם קפה",
      "barcode": "7290116933191",
      "brand": "",
      "minPrice": 7.0,
      "storeCount": 1175,
      "imageUrl": "https://www.tnuva.co.il/wp-content/uploads/2026/03/7290116933191_Small.jpg"
    },
    {
      "id": 7607,
      "name": "מארז קפה טורקי לדרך",
      "barcode": "7290107953559",
      "brand": "",
      "minPrice": 14.3,
      "storeCount": 1172,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290107953559-665068/7290107953559/2025-02-27T02-49-08-602Z.jpg"
    },
    {
      "id": 418,
      "name": "קפה נמס 50 גרם",
      "barcode": "7290000176413",
      "brand": "",
      "minPrice": 8.9,
      "storeCount": 1168,
      "imageUrl": "https://m.pricez.co.il/ProductPictures/7290000176413.jpg"
    },
    {
      "id": 417,
      "name": "קפה עם הל",
      "barcode": "7290000176079",
      "brand": "",
      "minPrice": 8.2,
      "storeCount": 1142,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1470/large/7290000176079-993050/7290000176079/2025-06-02T14-01-22-001Z.jpg"
    },
    {
      "id": 8380,
      "name": "קפסולות קפה אספרסו חזק אש 20",
      "barcode": "7290110572884",
      "brand": "",
      "minPrice": 13.9,
      "storeCount": 1124,
      "imageUrl": "https://res.cloudinary.com/shufersal/image/upload/f_auto,q_auto/v1551800922/prod/product_images/products_zoom/EYV54_Z_P_7290110572884_1.png"
    },
    {
      "id": 1186,
      "name": "משקה קפה קר בסגנון ק",
      "barcode": "7290110563431",
      "brand": "",
      "minPrice": 6.7,
      "storeCount": 1106,
      "imageUrl": "https://d226b0iufwcjmj.cloudfront.net/gs1-products/1062/large/7290110563431-938311/7290110563431/2025-02-19T21-27-10-870Z.jpg"
    }
  ]
};

const CATEGORIES = [
  { label: 'חלב וביצים', emoji: '🥛', q: 'חלב' },
  { label: 'לחם ואפייה', emoji: '🍞', q: 'לחם' },
  { label: 'בשר ועוף', emoji: '🥩', q: 'עוף' },
  { label: 'שמן ותבלינים', emoji: '🫒', q: 'שמן' },
  { label: 'אורז ופסטה', emoji: '🍚', q: 'אורז' },
  { label: 'שתייה', emoji: '🥤', q: 'קולה' },
  { label: 'חטיפים', emoji: '🍫', q: 'במבה' },
  { label: 'גבינות', emoji: '🧀', q: 'גבינה' },
  { label: 'ביצים', emoji: '🥚', q: 'ביצים' },
  { label: 'קפה ותה', emoji: '☕', q: 'קפה' },
];

interface Product {
  id: number;
  barcode: string;
  name: string;
  brand: string;
  minPrice: number | null;
  storeCount: number;
  imageUrl?: string | null;
}

function ProductImg({ name, imageUrl, size = 52 }: { name: string; imageUrl?: string | null; size?: number }) {
  const [err, setErr] = useState(false);
  if (!imageUrl || err) return (
    <div className="rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <span style={{ fontSize: size * 0.4 }}>📦</span>
    </div>
  );
  return (
    <img src={imageUrl} alt={name} onError={() => setErr(true)}
      className="rounded-xl object-contain bg-gray-50 flex-shrink-0"
      style={{ width: size, height: size }} />
  );
}

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function QuickAddProducts({ onAdd }: { onAdd: (p: Product) => void }) {
  const [activeCat, setActiveCat] = useState(0);
  const [cache, setCache] = useState<Record<number, Product[]>>(DEFAULT_PRODUCTS);
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const sliderRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const fetchCategory = useCallback(async (idx: number) => {
    if (cache[idx] && cache[idx].length > 1) return;
    const cat = CATEGORIES[idx];
    try {
      const res = await fetch(`${API}/search?q=${encodeURIComponent(cat.q)}&limit=20`);
      const d = await res.json();
      const sorted = (d.results || []).sort(
        (a: Product, b: Product) => (b.storeCount || 0) - (a.storeCount || 0)
      );
      if (sorted.length > 0) setCache(prev => ({ ...prev, [idx]: sorted }));
    } catch {}
  }, [cache]);

  useEffect(() => {
    CATEGORIES.forEach((_, i) => fetchCategory(i));
  }, []);

  const updateScrollState = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    setCanScrollLeft(scrollLeft < -10);
    setCanScrollRight(scrollLeft > -(scrollWidth - clientWidth - 10));
  };

  const scroll = (dir: 'left' | 'right') => {
    if (!sliderRef.current) return;
    sliderRef.current.scrollBy({ left: dir === 'left' ? 240 : -240, behavior: 'smooth' });
  };

  const handleAdd = (p: Product) => {
    onAdd(p);
    setAdded(prev => new Set([...prev, p.id]));
    setTimeout(() => setAdded(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 2000);
  };

  const products = cache[activeCat] || DEFAULT_PRODUCTS[activeCat] || [];

  return (
    <div className="max-w-2xl mx-auto px-4 mb-4">
      <p className="text-[11px] font-semibold text-gray-400 mb-2.5 uppercase tracking-wide">הוסיפו מוצרי בסיס לסל</p>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-3" style={{ scrollbarWidth: 'none' }}>
        {CATEGORIES.map((cat, i) => (
          <button key={cat.label} onClick={() => setActiveCat(i)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
              activeCat === i ? 'bg-emerald-500 border-emerald-500 text-white shadow-md' : 'bg-white border-gray-100 text-gray-600 hover:border-emerald-300'
            }`}>
            <span>{cat.emoji}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      <div className="relative">
        {canScrollLeft && (
          <div className="absolute right-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to left, transparent, white)' }} />
        )}
        {canScrollRight && (
          <div className="absolute left-0 top-0 bottom-0 w-10 z-10 pointer-events-none"
            style={{ background: 'linear-gradient(to right, transparent, white)' }} />
        )}
        {canScrollLeft && (
          <button onClick={() => scroll('left')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-all -mr-2 text-lg font-bold">
            ›
          </button>
        )}
        {canScrollRight && (
          <button onClick={() => scroll('right')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-8 h-8 bg-white border-2 border-gray-100 rounded-full shadow-md flex items-center justify-center text-gray-600 hover:border-emerald-400 transition-all -ml-2 text-lg font-bold">
            ‹
          </button>
        )}

        <div ref={sliderRef} onScroll={updateScrollState} dir="ltr"
          className="flex gap-3 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
          {products.map(p => (
            <div key={p.id} dir="rtl"
              className="flex-shrink-0 bg-white rounded-2xl border-2 border-gray-100 p-2.5 flex flex-col items-center gap-1.5 hover:border-emerald-200 transition-all"
              style={{ width: 120 }}>
              <ProductImg name={p.name} imageUrl={p.imageUrl} size={52} />
              <p className="text-[11px] font-medium text-gray-800 text-center leading-tight line-clamp-2 w-full flex-1">{p.name}</p>
              {p.minPrice && <p className="text-[10px] text-emerald-600 font-bold">מ-₪{Number(p.minPrice).toFixed(2)}</p>}
              <button onClick={() => handleAdd(p)}
                className={`w-full py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                  added.has(p.id) ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-700 hover:bg-emerald-500 hover:text-white'
                }`}>
                {added.has(p.id) ? '✓ נוסף' : '+ לסל'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

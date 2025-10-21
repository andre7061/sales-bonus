/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */ //919.07;
function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity = 0 } = purchase;
  if (discount == 0) {
    return (
      sale_price * quantity -
      _product.purchase_price * quantity
    );
  } else {
    return (
      sale_price * (1 - discount / 100) * quantity -
      _product.purchase_price * quantity
    );
  }
}
//  card.sale_price * (1 - card.discount / 100) * card.quantity -
//    product.purchase_price * card.quantity;
/**
 * Функция для расчета бонусов
 * @param index порядковый номер в отсортированном массиве
 * @param total общее число продавцов
 * @param seller карточка продавца
 * @returns {number}
 */
function calculateBonusByProfit(index, total, seller) {
  const { profit } = seller;
  if (index === 0) {
    return Number(((profit / 100) * 15).toFixed(2));
  } else if (index === 1 || index === 2) {
    return Number(((profit / 100) * 10).toFixed(2));
  } else if (index === total - 1) {
    return 0;
  } else {
    return Number(((profit / 100) * 5).toFixed(2));
  }
}

/**
 * Функция для анализа данных продаж
 * @param data
 * @param options
 * @returns {{revenue, top_products, bonus, name, sales_count, profit, seller_id}[]}
 */

function analyzeSalesData(data, options) {
  const { calculateRevenue, calculateBonus } = options;
  // @TODO: Проверка входных данных
  if (!data) {
    throw new Error('Некорректные входные данные');
  }

  // @TODO: Проверка наличия опций
  if (
    typeof calculateRevenue !== 'function' &&
    typeof calculateBonus !== 'function' &&
    typeof options == 'object'
  ) {
    throw new Error('Чего-то не хватает');
  }

  // @TODO: Подготовка промежуточных данных для сбора статистики

  const sellerStats = data.sellers.map((seller) => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: +(0).toFixed(2),
    top_products: [],
    bonus: 0,
    // Заполним начальными данными
  }));

  const sellerIndex = data.sellers.reduce(
    (result, seller) => ({
      ...result,
      [seller.id]: seller,
    }),
    {}
  );

  // Создаем индекс товаров
  const productIndex = data.products.reduce(
    (result, product) => ({
      ...result,
      [product.sku]: product,
    }),
    {}
  );

  data.purchase_records.forEach((record) => {
    // Чек
    const seller = sellerIndex[record.seller_id]; // Продавец
    const arrTopProduct = [];
    sellerStats.forEach((el) => {
      if (seller.id === el.seller_id) {
        el.sales_count += 1;
        el.revenue += record.total_amount;
        record.items.forEach((card) => {
          const product = productIndex[card.sku];
          el.profit += calculateSimpleRevenue(card, product);
          const key = card.sku;
          const meaning = card.quantity;

          arrTopProduct.push({ [key]: meaning });

          el.top_products.push({ [key]: meaning });
        });
      }
    });
  });

  sellerStats.forEach((el) => {
    el.profit = Number(el.profit.toFixed(2));
    el.revenue = Number(el.revenue.toFixed(2));
  });

  //сортировка
  const sortSellerStats = sellerStats.sort((a, b) => b.profit - a.profit);

  sortSellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sortSellerStats.length, seller);
    seller.top_products = seller.top_products.reduce((acc, el) => {
      const key = Object.keys(el)[0];
      const value = Object.values(el)[0];

      const existing = acc.find((item) => Object.keys(item)[0] === key);

      if (existing) {
        const existingKey = Object.keys(existing)[0];
        existing[existingKey] += value;
      } else {
        acc.push({ ...el });
      }

      return acc;
    }, []);

    seller.top_products = seller.top_products.slice(0, 10);
    seller.top_products.sort(
      (a, b) => Object.values(b)[0] - Object.values(a)[0]
    );
  });

  //   return card
  return sortSellerStats;
  // })
}

/**
 * Функция для расчета выручки
 * @param purchase запись о покупке
 * @param _product карточка товара
 * @returns {number}
 */ //919.07;

function calculateSimpleRevenue(purchase, _product) {
  const { discount, sale_price, quantity = 0 } = purchase;

  // Игнорируем _product, так как нам нужна только выручка
  return sale_price * (1 - discount / 100) * quantity;
}
function calculateSimpleProfit(purchase, _product) {
  const { discount, sale_price, quantity = 0 } = purchase;

  return (
    sale_price * (1 - discount / 100) * quantity -
    _product.purchase_price * quantity
  );
}

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
  if (!options || typeof options !== 'object') {
    throw new Error('Некорректные опции');
  }

  const { calculateRevenue, calculateBonus } = options;

  if (typeof calculateRevenue !== 'function') {
    throw new Error('calculateRevenue должна быть функцией');
  }

  if (typeof calculateBonus !== 'function') {
    throw new Error('calculateBonus должна быть функцией');
  }

  // Проверка обязательных полей в data
  if (
    !data.sellers ||
    !Array.isArray(data.sellers) ||
    data.sellers.length === 0
  ) {
    throw new Error('Некорректные данные sellers');
  }

  if (!data.products || !Array.isArray(data.products)) {
    throw new Error('Некорректные данные products');
  }

  if (
    !data.purchase_records ||
    !Array.isArray(data.purchase_records) ||
    data.purchase_records.length === 0
  ) {
    throw new Error('Некорректные данные purchase_records');
  }

  // Подготовка промежуточных данных для сбора статистики
  const sellerStats = data.sellers.map((seller) => ({
    seller_id: seller.id,
    name: `${seller.first_name} ${seller.last_name}`,
    revenue: 0,
    profit: 0,
    sales_count: 0,
    top_products: [],
    bonus: 0,
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

  // Собираем статистику по продажам
  data.purchase_records.forEach((record) => {
    const seller = sellerIndex[record.seller_id];

    sellerStats.forEach((el) => {
      if (seller.id === el.seller_id) {
        el.sales_count += 1;
        el.revenue += record.total_amount;

        record.items.forEach((card) => {
          const product = productIndex[card.sku];
          el.profit += calculateSimpleProfit(card, product);
        });
      }
    });
  });

  // Округляем денежные значения
  sellerStats.forEach((el) => {
    el.profit = Number(el.profit.toFixed(2));
    el.revenue = Number(el.revenue.toFixed(2));
  });

  // Собираем топ товары для каждого продавца
  sellerStats.forEach((seller) => {
    const productStats = {};

    // Собираем статистику по товарам из всех чеков продавца
    data.purchase_records.forEach((record) => {
      if (record.seller_id === seller.seller_id) {
        record.items.forEach((item) => {
          if (!productStats[item.sku]) {
            productStats[item.sku] = 0;
          }
          productStats[item.sku] += item.quantity;
        });
      }
    });

    // Преобразуем в массив и сортируем
    seller.top_products = Object.entries(productStats)
      .map(([sku, quantity]) => ({ sku, quantity }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  });

  // Сортируем продавцов по прибыли
  const sortSellerStats = sellerStats.sort((a, b) => b.profit - a.profit);

  // Назначаем бонусы
  sortSellerStats.forEach((seller, index) => {
    seller.bonus = calculateBonus(index, sortSellerStats.length, seller);
  });
  return sortSellerStats;
}

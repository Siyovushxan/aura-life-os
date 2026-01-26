export type Language = 'uz' | 'ru' | 'en';

export const translations = {
    uz: {
        nav: {
            hero: "Bosh sahifa",
            problem: "Muammo",
            solution: "Yechim",
            butterfly: "Kapalak Effekti",
            platforms: "Platformalar",
            family: "Oila",
            liveness: "Hayot Signali",
            author: "Muallif",
            cta: "Boshlash",
            info: "Ma'lumot"
        },
        sidebar: {
            dashboard: "Bosh sahifa",
            family: "Oila",
            finance: "Moliya",
            tasks: "Vazifalar",
            health: "Salomatlik",
            food: "Ovqatlanish",
            mind: "Diqqat",
            interests: "Qiziqishlar",
            liveness: "Hayot Signali",
            settings: "Sozlamalar",
            archived: "Arxivlangan"
        },
        hero: {
            title: "Hayotingizni yashayapsizmi yoki shunchaki kuzatyapsizmi?",
            subtitle: "Moliya, Salomatlik, Oila va Ruhiyat — barchasini yagona Sun'iy Intellekt yordamida \"Tirik Organizm\"dek boshqaring.",
            cta_main: "Boshqaruv Markaziga Kirish",
            cta_secondary: "Kelajakka Qadam Qo'ying",
        },
        problem: {
            title: "PARCHALANISH INQIROZI",
            subtitle: "O'rtacha inson 10 dan ortiq ilova o'rtasida parchalanib ketmoqda. AURA — bu tartib.",
            comparison: {
                old_way: {
                    title: "Tarqoq Tizimlar",
                    list: [
                        "❌ 10 xil ilova (Notion, Excel, Todoist)",
                        "❌ Ma'lumotlar o'rtasida aloqa yo'q",
                        "❌ Doimiy stress va tahlilsiz xatti-harakatlar",
                        "❌ Faqat o'tmishni qayd etish, kelajakni emas"
                    ]
                },
                aura_way: {
                    title: "Yagona Intellekt",
                    list: [
                        "✅ Barcha modullar bitta ekotizimda",
                        "✅ AI orqali avtomatik bog'liqliklar",
                        "✅ Kelajakni bashorat qilish (Prediction)",
                        "✅ Hayotiy qarorlar uchun aniq dashboard"
                    ]
                }
            }
        },
        solution: {
            title: "Tanishing: AURA",
            subtitle: "Shunchaki ilova emas, bu Sizning Hayot Tizimingiz (Life OS).",
            cards: {
                secure: {
                    title: "Xavfsiz (Secure)",
                    desc: "Sizning ma'lumotlaringiz shifrlangan. Sirlaringiz faqat o'zingizniki.",
                },
                smart: {
                    title: "Aqlli (Smart)",
                    desc: "7 ta modul bitta tizimda. Ortiqcha ilovalarni o'chiring.",
                },
                ai: {
                    title: "Sun'iy Intellekt (AI)",
                    desc: "Shunchaki hisoblagich emas, shaxsiy maslahatchi.",
                }
            }
        },
        butterfly: {
            title: "Hamma narsa bog'liq.",
            question: "Agar bugun kamroq uxlasangiz nima bo'ladi?",
            hours: "soat",
            result: "Kam uyqu irodangizni susaytiradi, bu esa hissiy xarajatlarga va ish unumdorligining pasayishiga olib keladi. AURA buni oldindan ko'ra oladi.",
            matrix: {
                health: { title: "Salomatlik", status_bad: "Kritik", status_good: "Optimal", desc: "Tiklanish jarayoni buzilgan." },
                focus: { title: "Diqqat", status_bad: "Past", status_good: "Yuqori", desc: "Analitik qobiliyat pasaymoqda." },
                social: { title: "Ijtimoiy", status: "Barqaror", desc: "Hissiy muvozanat saqlanmoqda." },
                future: { title: "Kelajak", status: "Bashorat", desc: "Kutilmagan xarajatlar xavfi +12%." }
            },
            quote: "\"Biz buni Kapalak Effekti deymiz.\""
        },
        platforms: {
            title: "Dual Reality",
            mobile: {
                title: "The Soul (Ruh)",
                desc: "Sizning hissiyotlaringiz va tezkor harakatlaringiz uchun. Minimalistik dizayn, maksimal tezlik.",
                btn: "Ilovani Yuklab Oling"
            },
            web: {
                title: "The Brain (Miya)",
                desc: "Sizning strategik qarorgohingiz. Tahlil, rejalashtirish va kengaytirilgan boshqaruv.",
                btn: "Dashboardni Ochish"
            }
        },
        family: {
            title: "Avlodlar o'rtasidagi raqamli ko'prik",
            cards: {
                parenting: {
                    title: "Aqlli Tarbiya (Parenting)",
                    desc: "Bolalarning ekran vaqtini foydali vazifalar bilan muvozanatlash tizimi.",
                },
                legacy: {
                    title: "Raqamli Shajara (Legacy)",
                    desc: "Oilaviy tarix, genetik ma'lumotlar va merosni xavfsiz saqlash.",
                },
                elder: {
                    title: "Keksalar G'amxurligi",
                    desc: "Yaqinlaringiz xavfsizligini masofadan nazorat qilish va ularga ko'maklashish.",
                }
            }
        },
        liveness_section: {
            title: "HAYOT SIGNALI",
            subtitle: "Avlodlar g'amxo'rligining raqamli ko'prigi.",
            desc: "Yaqinlaringiz uchun passiv monitoring. Agar belgilangan vaqtda faollik bo'lmasa, oila a'zolari ogohlantiriladi. Keksalar xavfsizligi uchun ideal.",
            cta: "Signalni sozlash",
            checkInPrompt: "Azamat ota, ahvolingiz yaxshimi? Iltimos, tasdiqlang."
        },
        author: {
            title: "Loyiha Arxitektori",
            name: "ArslanXan",
            role: "IT-Analitik & PM",
            bio: "AURA — bu shunchaki kod emas, bu hayotga bo'lgan qarashimdir. Loyihaning g'oyasi, dizayni va kodi 100% o'zim tomonidan ishlab chiqilgan. Maqsadim — texnologiya yordamida inson hayotini tartibga solish va uni mazmunliroq qilish.",
            partners_title: "Texnologik Hamkorlarimiz",
            thanks: "Loyiha ishlab chiqilishida ko'rsatgan yordami va ilg'or texnologiyalari uchun minnatdorchilik bildiramiz:"
        },
        social: {
            title: "Insonlar nima deydi?",
            reviews: [
                {
                    text: "\"Biznes va shaxsiy hayotim o'rtasidagi balansni saqlab qolgan yagona vosita.\"",
                    author: "- Ahmad, Tadbirkor"
                },
                {
                    text: "\"Bolalarim telefon uchun urishmay qo'ydi. Ular endi 'ishlab' vaqt topishadi.\"",
                    author: "- Dilnoza, Ona"
                }
            ]
        },
        footer: {
            cta_title: "Hayotingizni o'zgartirish uchun 7 kun yetarli.",
            cta_subtitle: "Hech qanday majburiyat yo'q.",
            cta_btn: "Bepul Sinovni Boshlash",
            description: "The Ultimate Life OS — moliya, salomatlik va oilani yagona \"Tirik Tizim\" orqali boshqarish.",
            newsletter_title: "Premium Bildirishnomalar",
            newsletter_desc: "Inson samaradorligining kelajagiga birinchilardan bo'lib kiring.",
            newsletter_placeholder: "Sizning elektron manzilingiz...",
            newsletter_btn: "Obuna bo'lish",
            links: {
                product: "Mahsulot",
                company: "Kompaniya",
                features: "Imkoniyatlar",
                pricing: "Narxlar",
                enterprise: "Korxona",
                download: "Yuklab olish",
                about: "Biz haqimizda",
                missions: "Missiyalar",
                careers: "Karyera",
                contact: "Aloqa",
                privacy: "Maxfiylik",
                terms: "Shartlar",
                cookies: "Kukilar"
            },
            copyright: "© 2026 AURA Life OS. Barcha huquqlar himoyalangan."
        },
        home: {
            analyzing: "AURA AI tahlil qilmoqda...",
            daily_insight: "Kundalik AI Tahlili",
            save_success: "Tahlil muvaffaqiyatli saqlandi",
            need_more_data: "Tahlil uchun ma'lumotlar yetarli emas. Iltimos, modullarni to'ldiring.",
            analysis_error: "Tizim tahlilida xatolik yuz berdi. Iltimos, servislar holatini tekshiring.",
            system_ready: "AURA AI tizimi tayyor",
            modules: {
                finance: "Moliya",
                health: "Salomatlik",
                family: "Oila",
                mind: "Ruhiyat",
                food: "Taomnoma"
            }
        },
        product_details: {
            features: {
                title: "AURA Imkoniyatlari",
                subtitle: "8 ta modul, bitta ekotizim. Hayotingizni boshqarishning yangi darajasi.",
                modules: [
                    { name: "Oila", desc: "Raqamli shajara, bolalar uchun ekran vaqtini boshqarish va xavfsizlik nazorati." },
                    { name: "Moliya", desc: "Xarajatlarni AI tahlil qilish, kelajakdagi balansni bashorat qilish va aqlli jamg'arma rejalari." },
                    { name: "Vazifalar", desc: "AI tomonidan saralangan vazifalar, Deep Work rejimi va samaradorlik statistikasi." },
                    { name: "Salomatlik", desc: "Body Battery, uyqu tahlili va biometrik ma'lumotlar asosida shaxsiy tavsiyalar." },
                    { name: "Ovqatlanish", desc: "Sog'lom ovqatlanish rejasi, kaloriyalar hisobi va AI tomonidan tayyorlangan retseptlar." },
                    { name: "Diqqat", desc: "Stress tahlili, diqqat sessiyalari va hissiy holatni muvozanatlash." },
                    { name: "Qiziqishlar", desc: "Shaxsiy rivojlanish, yangi ko'nikmalar va sevimli mashg'ulotlar uchun AI yo'riqnomasi." },
                    { name: "Hayot Signali", desc: "Agar belgilangan vaqtda tizimda faollik bo'lmasa, yaqinlaringizga avtomatik xabar yuborish." }
                ]
            },
            pricing: {
                title: "Premiumga o'ting",
                subtitle: "O'zingizga mos rejani tanlang va AURA-ning to'liq kuchidan foydalaning.",
                plans: [
                    { name: "Free", price: "0", period: "oy", features: ["The Soul (Mobile versiya)", "Asosiy ma'lumotlar", "Kunlik 1 ta AI insight"] },
                    { name: "Expert", price: "9", period: "oy", features: ["The Brain (Web Dashboard)", "Groq AI tahlili", "Cheksiz AI insightlar", "Prioritetli qo'llab-quvvatlash"] },
                    { name: "Family", price: "19", period: "oy", features: ["5 tagacha oila a'zosi", "Raqamli Meros (Legacy)", "Ota-ona nazorati", "Ekspert rejasining barcha imkoniyatlari"] }
                ]
            },
            enterprise: {
                title: "Korxona uchun AURA",
                subtitle: "Tashkilotingiz samaradorligini yangi darajaga olib chiqing.",
                features: [
                    { name: "Maxfiylik", desc: "Ma'lumotlar faqat sizning serveringizda qoladi." },
                    { name: "Maxsus AI", desc: "Kompaniyangiz ma'lumotlari asosida o'qitilgan shaxsiy AI." },
                    { name: "API integratsiya", desc: "Mavjud tizimlaringiz bilan to'liq integratsiya." }
                ]
            },
            download: {
                title: "AURA-ni yuklab oling",
                subtitle: "Har qanday qurilmada foydalaning.",
                pwa: {
                    title: "PWA sifatida o'rnatish",
                    steps: [
                        "Brauzeringizda 'Ulashish' yoki 'Sozlamalar'ni bosing.",
                        "'Asosiy ekranga qo'shish'ni tanlang.",
                        "AURA-dan ilova kabi foydalaning."
                    ]
                },
                stores: [
                    { name: "App Store", link: "#", available: "Yaqinda" },
                    { name: "Google Play", link: "#", available: "Yaqinda" }
                ]
            }
        },
        company_details: {
            about: {
                title: "Biz haqimizda",
                text: "AURA — bu shunchaki ilova emas. Bu inson hayotini tartibga soluvchi raqamli ekotizimdir. Biz texnologiya insonni charchatmasligi, aksincha unga erkinlik berishi kerak deb ishonamiz."
            },
            missions: {
                title: "Bizning Missiyamiz",
                list: [
                    "Inson samaradorligini AI orqali oshirish.",
                    "Ma'lumotlar maxfiyligini mutloq ta'minlash.",
                    "Kelajakni hozirdan boshlab rejalashtirish."
                ]
            },
            careers: {
                title: "Karyera",
                subtitle: "Kelajakni biz bilan o'zgartiring.",
                text: "Biz har doim iqtidorli muhandislar, dizaynerlar va tahlilchilarni kutamiz.",
                cta: "Rezyume yuborish"
            },
            contact: {
                title: "Aloqa",
                subtitle: "Biz bilan bog'laning.",
                email: "aura-web-app@gmail.com",
                socials: ["Telegram", "Instagram", "YouTube", "TikTok"],
                handle: "aura_life_os"
            }
        }
    },
    ru: {
        nav: {
            hero: "Главная",
            problem: "Проблема",
            solution: "Решение",
            butterfly: "Эффект Бабочки",
            platforms: "Платформы",
            family: "Семья",
            liveness: "Пульс Жизни",
            author: "Автор",
            cta: "Начать",
            info: "Инфо"
        },
        sidebar: {
            dashboard: "Главная",
            family: "Семья",
            finance: "Финансы",
            tasks: "Задачи",
            health: "Здоровье",
            food: "Питание",
            mind: "Разум",
            interests: "Интересов",
            settings: "Настройки",
            archived: "Архивировано"
        },
        hero: {
            title: "Вы живете своей жизнью или просто наблюдаете?",
            subtitle: "Финансы, Здоровье, Семья и Разум — управляйте всем как «Живым Организмом» с помощью единого ИИ.",
            cta_main: "Войти в Центр Управления",
            cta_secondary: "Шаг в будущее",
        },
        problem: {
            title: "КРИЗИС ФРАГМЕНТАЦИИ",
            subtitle: "Средний человек разрывается между более чем 10 приложениями. AURA — это порядок.",
            comparison: {
                old_way: {
                    title: "Разрозненные Системы",
                    list: [
                        "❌ 10 разных приложений (Notion, Excel, Todoist)",
                        "❌ Нет связи между данными и модулями",
                        "❌ Постоянный стресс и хаотичные действия",
                        "❌ Только фиксация прошлого, а не будущего"
                    ]
                },
                aura_way: {
                    title: "Единый Интеллект",
                    list: [
                        "✅ Все модули в одной экосистеме",
                        "✅ Автоматические корреляции через ИИ",
                        "✅ Предсказание будущего (Prediction)",
                        "✅ Четкий дашборд для жизненных решений"
                    ]
                }
            }
        },
        solution: {
            title: "Знакомьтесь: AURA",
            subtitle: "Не просто приложение, это ваша Жизненная Система (Life OS).",
            cards: {
                secure: {
                    title: "Безопасно (Secure)",
                    desc: "Ваши данные зашифрованы. Ваши секреты принадлежат только вам.",
                },
                smart: {
                    title: "Умно (Smart)",
                    desc: "7 модулей в одной системе. Удалите лишние приложения.",
                },
                ai: {
                    title: "ИИ (AI)",
                    desc: "Не просто калькулятор, а личный советник.",
                }
            }
        },
        butterfly: {
            title: "Всё взаимосвязано.",
            question: "Что будет, если вы сегодня поспите меньше?",
            hours: "час",
            result: "Недосып ослабляет вашу силу воли, что приводит к эмоциональным тратам и снижению продуктивности. AURA видит это заранее.",
            matrix: {
                health: { title: "Здоровье", status_bad: "Критично", status_good: "Оптимально", desc: "Процесс восстановления нарушен." },
                focus: { title: "Внимание", status_bad: "Низкое", status_good: "Высокое", desc: "Аналитические способности снижаются." },
                social: { title: "Социальное", status: "Стабильно", desc: "Эмоциональный баланс сохранен." },
                future: { title: "Будущее", status: "Прогноз", desc: "Риск непредвиденных расходов +12%." }
            },
            quote: "\"Мы называем это Эффектом Бабочки.\""
        },
        platforms: {
            title: "Dual Reality",
            mobile: {
                title: "The Soul (Душа)",
                desc: "Для ваших чувств и быстрых действий. Минималистичный дизайн, максимальная скорость.",
                btn: "Скачать Приложение"
            },
            web: {
                title: "The Brain (Мозг)",
                desc: "Ваш стратегический штаб. Анализ, планирование и продвинутое управление.",
                btn: "Открыть Дашборд"
            }
        },
        family: {
            title: "Цифровой мост между поколениями",
            cards: {
                parenting: {
                    title: "Умное Воспитание",
                    desc: "Система баланса экранного времени и полезных задач для детей.",
                },
                legacy: {
                    title: "Цифровое Древо (Legacy)",
                    desc: "Безопасное хранение семейной истории, генетики и наследия.",
                },
                elder: {
                    title: "Забота о Старших",
                    desc: "Дистанционный контроль безопасности и поддержка ваших близких.",
                }
            }
        },
        liveness_section: {
            title: "ПУЛЬС ЖИЗНИ",
            subtitle: "Цифровой мост заботы о близких.",
            desc: "Пассивный мониторинг ваших близких. Если активность не обнаружена в заданное окно, семья получит уведомление. Идеально для безопасности пожилых людей.",
            cta: "Настроить Пульс",
            checkInPrompt: "Азамат ота, вы в порядке? Пожалуйста, подтвердите."
        },
        author: {
            title: "Архитектор Проекта",
            name: "АрсланХан",
            role: "IT-Аналитик & PM",
            bio: "AURA — это не просто код, это мое видение жизни. Идея, дизайн и код проекта на 100% разработаны мной. Моя цель — с помощью технологий упорядочить жизнь человека и сделать ее более осмысленной.",
            partners_title: "Технологические Партнеры",
            thanks: "Выражаем благодарность за поддержку и передовые технологии при разработке проекта:"
        },
        social: {
            title: "Что говорят люди?",
            reviews: [
                {
                    text: "\"Единственный инструмент, который помог сохранить баланс между бизнесом и личной жизнью.\"",
                    author: "- Ахмад, Предприниматель"
                },
                {
                    text: "\"Дети перестали ссориться из-за телефона. Теперь они 'зарабатывают' время.\"",
                    author: "- Дильноза, Мама"
                }
            ]
        },
        footer: {
            cta_title: "7 дней достаточно, чтобы изменить жизнь.",
            cta_subtitle: "Никаких обязательств.",
            cta_btn: "Начать Пробный Период",
            description: "The Ultimate Life OS — управление финансами, здоровьем и семьей через единую «Живую Систему».",
            newsletter_title: "Premium Уведомления",
            newsletter_desc: "Будьте первым, кто войдет в будущее человеческой эффективности.",
            newsletter_placeholder: "Ваш email...",
            newsletter_btn: "Подписаться",
            links: {
                product: "Продукт",
                company: "Компания",
                features: "Функции",
                pricing: "Цены",
                enterprise: "Предприятие",
                download: "Скачать",
                about: "О нас",
                missions: "Миссии",
                careers: "Карьера",
                contact: "Контакт",
                privacy: "Конфиденциальность",
                terms: "Условия",
                cookies: "Куки"
            },
            copyright: "© 2026 AURA Life OS. Все права защищены."
        },
        home: {
            analyzing: "AURA AI анализирует...",
            daily_insight: "Ежедневный ИИ Анализ",
            save_success: "Анализ успешно сохранен",
            need_more_data: "Недостаточно данных для анализа. Пожалуйста, заполните модули.",
            analysis_error: "Ошибка при анализе системы. Пожалуйста, проверьте состояние сервисов.",
            system_ready: "Система AURA AI готова",
            modules: {
                finance: "Финансы",
                health: "Здоровье",
                family: "Семья",
                mind: "Разум",
                food: "Питание"
            }
        },
        product_details: {
            features: {
                title: "Возможности AURA",
                subtitle: "8 модулей, одна экосистема. Новый уровень управления жизнью.",
                modules: [
                    { name: "Семья", desc: "Цифровое древо, управление экранным временем детей и контроль безопасности." },
                    { name: "Финансы", desc: "ИИ-анализ расходов, прогноз будущего баланса и умные планы накоплений." },
                    { name: "Задачи", desc: "Задачи, отсортированные ИИ, режим Deep Work и статистика продуктивности." },
                    { name: "Здоровье", desc: "Body Battery, анализ сна и персональные рекомендации на основе биометрии." },
                    { name: "Питание", desc: "План здорового питания, расчет калорий и рецепты, созданные ИИ." },
                    { name: "Фокус", desc: "Анализ стресса, сессии фокусировки и балансировка эмоционального состояния." },
                    { name: "Интересы", desc: "ИИ-инструкции для личного развития, новых навыков и любимых хобби." },
                    { name: "Пульс Жизни", desc: "Автоматическое уведомление близких при отсутствии активности в заданное время." }
                ]
            },
            pricing: {
                title: "Переходите на Premium",
                subtitle: "Выберите подходящий план и используйте всю мощь AURA.",
                plans: [
                    { name: "Free", price: "0", period: "мес", features: ["The Soul (Моб. версия)", "Базовая статистика", "1 ИИ-инсайт в день"] },
                    { name: "Expert", price: "9", period: "мес", features: ["The Brain (Web Dashboard)", "Анализ Groq AI", "Безлимитные ИИ-инсайты", "Приоритетная поддержка"] },
                    { name: "Family", price: "19", period: "мес", features: ["До 5 членов семьи", "Цифровое наследие (Legacy)", "Родительский контроль", "Все функции плана Expert"] }
                ]
            },
            enterprise: {
                title: "AURA для Предприятий",
                subtitle: "Поднимите эффективность вашей организации на новый уровень.",
                features: [
                    { name: "Конфиденциальность", desc: "Данные хранятся только на ваших серверах." },
                    { name: "Кастомный ИИ", desc: "Персональный ИИ, обученный на данных вашей компании." },
                    { name: "API интеграция", desc: "Полная интеграция с вашими существующими системами." }
                ]
            },
            download: {
                title: "Скачать AURA",
                subtitle: "Используйте на любом устройстве.",
                pwa: {
                    title: "Установить как PWA",
                    steps: [
                        "Нажмите 'Поделиться' или 'Настройки' в браузере.",
                        "Выберите 'Добавить на главный экран'.",
                        "Используйте AURA как обычное приложение."
                    ]
                },
                stores: [
                    { name: "App Store", link: "#", available: "Скоро" },
                    { name: "Google Play", link: "#", available: "Скоро" }
                ]
            }
        },
        company_details: {
            about: {
                title: "О нас",
                text: "AURA — это не просто приложение. Это цифровая экосистема, упорядочивающая жизнь человека. Мы верим, что технологии не должны утомлять человека, а наоборот — дарить ему свободу."
            },
            missions: {
                title: "Наша Миссия",
                list: [
                    "Повышение эффективности человека через ИИ.",
                    "Обеспечение абсолютной конфиденциальности данных.",
                    "Планирование будущего уже сегодня."
                ]
            },
            careers: {
                title: "Карьера",
                subtitle: "Меняйте будущее вместе с нами.",
                text: "Мы всегда рады талантливым инженерам, дизайнерам и аналитикам.",
                cta: "Отправить резюме"
            },
            contact: {
                title: "Контакт",
                subtitle: "Свяжитесь с нами.",
                email: "aura-web-app@gmail.com",
                socials: ["Telegram", "Instagram", "YouTube", "TikTok"],
                handle: "aura_life_os"
            }
        }
    },
    en: {
        nav: {
            hero: "Home",
            problem: "Problem",
            solution: "Solution",
            butterfly: "Butterfly Effect",
            platforms: "Platforms",
            family: "Family",
            liveness: "Life Beacon",
            author: "Author",
            cta: "Get Started",
            info: "Info"
        },
        sidebar: {
            dashboard: "Dashboard",
            family: "Family",
            finance: "Finance",
            tasks: "Tasks",
            health: "Health",
            food: "Food",
            mind: "Mind",
            interests: "Interests",
            liveness: "Life Beacon",
            settings: "Settings",
            archived: "Archived"
        },
        hero: {
            title: "Are you living your life or just watching it?",
            subtitle: "Finance, Health, Family, and Mind — manage it all like a \"Living Organism\" with a single AI.",
            cta_main: "Enter Command Center",
            cta_secondary: "Step into the Future",
        },
        problem: {
            title: "FRAGMENTATION CRISIS",
            subtitle: "The average person is fragmented between 10+ apps. AURA is order.",
            comparison: {
                old_way: {
                    title: "Disconnected Systems",
                    list: [
                        "❌ 10 different apps (Notion, Excel, Todoist)",
                        "❌ No connection between data and modules",
                        "❌ Constant stress and chaotic actions",
                        "❌ Only tracking the past, not the future"
                    ]
                },
                aura_way: {
                    title: "Unified Intelligence",
                    list: [
                        "✅ All modules in one ecosystem",
                        "✅ AI-powered automatic correlations",
                        "✅ Future prediction & foresight",
                        "✅ Clear dashboard for life decisions"
                    ]
                }
            }
        },
        solution: {
            title: "Meet: AURA",
            subtitle: "Not just an app, it's your Life Operating System.",
            cards: {
                secure: {
                    title: "Secure",
                    desc: "Your data is encrypted. Your secrets belong only to you.",
                },
                smart: {
                    title: "Smart",
                    desc: "7 modules in one system. Delete necessary apps.",
                },
                ai: {
                    title: "AI-Powered",
                    desc: "Not just a calculator, but a personal advisor.",
                }
            }
        },
        butterfly: {
            title: "Everything is connected.",
            question: "What happens if you sleep less today?",
            hours: "hours",
            result: "Lack of sleep weakens your willpower, leading to emotional spending and decreased productivity. AURA predicts this in advance.",
            matrix: {
                health: { title: "Health", status_bad: "Critical", status_good: "Optimal", desc: "Restoration process is disrupted." },
                focus: { title: "Focus", status_bad: "Low", status_good: "High", desc: "Analytical abilities are declining." },
                social: { title: "Social", status: "Stable", desc: "Emotional balance is maintained." },
                future: { title: "Future", status: "Forecast", desc: "Risk of unexpected expenses +12%." }
            },
            quote: "\"We call this the Butterfly Effect.\""
        },
        platforms: {
            title: "Dual Reality",
            mobile: {
                title: "The Soul",
                desc: "For your feelings and quick actions. Minimalist design, maximum speed.",
                btn: "Download App"
            },
            web: {
                title: "The Brain",
                desc: "Your strategic headquarters. Analysis, planning, and advanced management.",
                btn: "Open Dashboard"
            }
        },
        family: {
            title: "Digital bridge between generations",
            cards: {
                parenting: {
                    title: "Smart Parenting",
                    desc: "A system to balance screen time with productive tasks for children.",
                },
                legacy: {
                    title: "Digital Legacy",
                    desc: "Secure storage for family history, genetics, and heritage.",
                },
                elder: {
                    title: "Elder Care",
                    desc: "Remote safety monitoring and support for your loved ones.",
                }
            }
        },
        liveness_section: {
            title: "LIFE BEACON",
            subtitle: "Bridging the legacy of care.",
            desc: "Passive monitoring for your loved ones. If no activity is detected within the set window, we'll alert the family. Ideal for senior safety.",
            cta: "Set Up Beacon",
            checkInPrompt: "Azamat Ota, are you okay? Please confirm."
        },
        author: {
            title: "Project Architect",
            name: "ArslanXan",
            role: "IT Analyst & PM",
            bio: "AURA is more than just code; it's my vision of life. The idea, design, and code of the project are 100% developed by me. My goal is to organize human life and make it more meaningful through technology.",
            partners_title: "Technology Partners",
            thanks: "Special thanks for the support and advanced technologies used in the development of this project:"
        },
        social: {
            title: "What people say?",
            reviews: [
                {
                    text: "\"The only tool that helped maintain balance between business and personal life.\"",
                    author: "- Ahmad, Entrepreneur"
                },
                {
                    text: "\"My kids stopped fighting over the phone. Now they 'earn' their time.\"",
                    author: "- Dilnoza, Mother"
                }
            ]
        },
        footer: {
            cta_title: "7 days is enough to change your life.",
            cta_subtitle: "No obligations.",
            cta_btn: "Start Free Trial",
            description: "The Ultimate Life OS — managing finance, health, and family through a unified \"Living System\".",
            newsletter_title: "Premium Notifications",
            newsletter_desc: "Be the first to enter the future of human efficiency.",
            newsletter_placeholder: "Your essence (email)...",
            newsletter_btn: "Subscribe",
            links: {
                product: "Product",
                company: "Company",
                features: "Features",
                pricing: "Pricing",
                enterprise: "Enterprise",
                download: "Download",
                about: "About",
                missions: "Missions",
                careers: "Careers",
                contact: "Contact",
                privacy: "Privacy",
                terms: "Terms",
                cookies: "Cookies"
            },
            copyright: "© 2026 AURA Life OS. All rights reserved."
        },
        home: {
            analyzing: "AURA AI is analyzing...",
            daily_insight: "Daily AI Insight",
            save_success: "Insight saved successfully",
            need_more_data: "Not enough data for analysis. Please fill the modules.",
            analysis_error: "Error during system analysis. Please check the status of services.",
            system_ready: "AURA AI system is ready",
            modules: {
                finance: "Finance",
                health: "Health",
                family: "Family",
                mind: "Mind",
                food: "Food"
            }
        },
        product_details: {
            features: {
                title: "AURA Features",
                subtitle: "8 modules, one ecosystem. A new level of life management.",
                modules: [
                    { name: "Family", desc: "Digital legacy, kids screen time management, and safety monitoring." },
                    { name: "Finance", desc: "AI expense analysis, future balance prediction, and smart savings plans." },
                    { name: "Tasks", desc: "AI-prioritized tasks, Deep Work mode, and productivity statistics." },
                    { name: "Health", desc: "Body Battery, sleep analysis, and personal recommendations based on biometrics." },
                    { name: "Nutrition", desc: "Healthy eating plans, calorie tracking, and AI-generated recipes." },
                    { name: "Focus", desc: "Stress analysis, focus sessions, and emotional state balancing." },
                    { name: "Interests", desc: "AI guidance for personal growth, new skills, and favorite hobbies." },
                    { name: "Life Beacon", desc: "Automated alerts to trusted contacts if no activity is detected within the set window." }
                ]
            },
            pricing: {
                title: "Go Premium",
                subtitle: "Choose the plan that fits you and unlock the full power of AURA.",
                plans: [
                    { name: "Free", price: "0", period: "mo", features: ["The Soul (Mobile App)", "Basic Data Tracking", "1 Daily AI Insight"] },
                    { name: "Expert", price: "9", period: "mo", features: ["The Brain (Web Dashboard)", "Groq AI Analysis", "Unlimited AI Insights", "Priority Support"] },
                    { name: "Family", price: "19", period: "mo", features: ["Up to 5 family members", "Digital Legacy", "Parental Controls", "Everything in Expert"] }
                ]
            },
            enterprise: {
                title: "AURA for Enterprise",
                subtitle: "Take your organization's efficiency to a new level.",
                features: [
                    { name: "Privacy First", desc: "Data remains strictly on your servers." },
                    { name: "Custom AI", desc: "Private AI trained on your company data." },
                    { name: "API Integration", desc: "Full synergy with your existing stacks." }
                ]
            },
            download: {
                title: "Download AURA",
                subtitle: "Use on any device seamlessly.",
                pwa: {
                    title: "Install as PWA",
                    steps: [
                        "Click 'Share' or 'Settings' in your browser.",
                        "Select 'Add to Home Screen'.",
                        "Use AURA just like a native app."
                    ]
                },
                stores: [
                    { name: "App Store", link: "#", available: "Coming Soon" },
                    { name: "Google Play", link: "#", available: "Coming Soon" }
                ]
            }
        },
        company_details: {
            about: {
                title: "About Us",
                text: "AURA is not just an app. It is a digital ecosystem that organizes human life. We believe technology should not exhaust people, but rather grant them freedom."
            },
            missions: {
                title: "Our Mission",
                list: [
                    "Enhance human efficiency through AI.",
                    "Ensure absolute data sovereignty.",
                    "Plan the future, starting today."
                ]
            },
            careers: {
                title: "Careers",
                subtitle: "Shape the future with us.",
                text: "We are always looking for talented engineers, designers, and analysts.",
                cta: "Send Resume"
            },
            contact: {
                title: "Contact",
                subtitle: "Get in touch with us.",
                email: "aura-web-app@gmail.com",
                socials: ["Telegram", "Instagram", "YouTube", "TikTok"],
                handle: "aura_life_os"
            }
        }
    }
};

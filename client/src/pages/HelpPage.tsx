import { useState } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";

type FaqItem = {
    question: string;
    answer: string;
};

type HelpCategory = {
    title: string;
    icon: string;
    description: string;
};

type TranslationSection = {
    hero: {
        title: string;
        subtitle: string;
        searchPlaceholder: string;
    };
    categories: {
        title: string;
        items: HelpCategory[];
    };
    faq: {
        title: string;
        items: FaqItem[];
    };
    cta: {
        title: string;
        subtitle: string;
        button: string;
    };
};

const HelpPage = () => {
    const { i18n } = useTranslation();
    const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

    const translations: Record<string, TranslationSection> = {
        ka: {
            hero: {
                title: "დახმარების ცენტრი",
                subtitle: "როგორ შეგვიძლია დაგეხმაროთ?",
                searchPlaceholder: "მოძებნეთ კითხვა...",
            },
            categories: {
                title: "პოპულარული თემები",
                items: [
                    {
                        title: "დაწყება",
                        description: "რეგისტრაცია და ანგარიშის მართვა",
                        icon: "mdi:rocket-launch",
                    },
                    {
                        title: "აუქციონები",
                        description: "მონაწილეობის მიღება და ბიდები",
                        icon: "mdi:gavel",
                    },
                    {
                        title: "ტრანსპორტირება",
                        description: "გადაზიდვა და ვადები",
                        icon: "mdi:truck-delivery",
                    },
                    {
                        title: "გადახდები",
                        description: "ანგარიშსწორება და ინვოისები",
                        icon: "mdi:credit-card-outline",
                    },
                ],
            },
            faq: {
                title: "ხშირად დასმული კითხვები",
                items: [
                    {
                        question: "როგორ დავრეგისტრირდე საიტზე?",
                        answer:
                            "საიტზე რეგისტრაციისთვის დააჭირეთ ღილაკს 'რეგისტრაცია' მარჯვენა ზედა კუთხეში და მიყევით ინსტრუქციას. დაგჭირდებათ პირადი ინფორმაციის და საკონტაქტო ნომრის მითითება.",
                    },
                    {
                        question: "რა ღირს აუქციონზე მონაწილეობა?",
                        answer:
                            "აუქციონზე მონაწილეობის საფასური დამოკიდებულია კონკრეტულ აუქციონზე (Copart, IAAI) და ავტომობილის ღირებულებაზე. დეტალური ინფორმაცია შეგიძლიათ იხილოთ კალკულატორის გვერდზე.",
                    },
                    {
                        question: "რამდენი ხანი სჭირდება ტრანსპორტირებას?",
                        answer:
                            "ტრანსპორტირების ვადა დამოკიდებულია ლოკაციაზე. საშუალოდ, ამერიკიდან საქართველოში ტრანსპორტირებას 6-8 კვირა სჭირდება.",
                    },
                    {
                        question: "როგორ შევამოწმო ავტომობილის ისტორია?",
                        answer:
                            "ჩვენ გთავაზობთ Carfax-ის სერვისს. შეგიძლიათ შეიყვანოთ VIN კოდი შესაბამის ველში და მიიღოთ დეტალური რეპორტი ავტომობილის ისტორიის შესახებ.",
                    },
                    {
                        question: "შესაძლებელია თუ არა ავტომობილის უკან დაბრუნება?",
                        answer:
                            "აუქციონის წესების თანახმად, შეძენილი ავტომობილის უკან დაბრუნება არ ხდება. გთხოვთ, ყურადღებით გაეცნოთ ავტომობილის მდგომარეობას შეძენამდე.",
                    },
                ],
            },
            cta: {
                title: "ვერ იპოვეთ პასუხი?",
                subtitle: "ჩვენი გუნდი მზადაა დაგეხმაროთ",
                button: "დაგვიკავშირდით",
            },
        },
        en: {
            hero: {
                title: "Help Center",
                subtitle: "How can we help you today?",
                searchPlaceholder: "Search for answers...",
            },
            categories: {
                title: "Popular Topics",
                items: [
                    {
                        title: "Getting Started",
                        description: "Registration and account management",
                        icon: "mdi:rocket-launch",
                    },
                    {
                        title: "Auctions",
                        description: "Participation and bidding",
                        icon: "mdi:gavel",
                    },
                    {
                        title: "Shipping",
                        description: "Transportation and timelines",
                        icon: "mdi:truck-delivery",
                    },
                    {
                        title: "Payments",
                        description: "Billing and invoices",
                        icon: "mdi:credit-card-outline",
                    },
                ],
            },
            faq: {
                title: "Frequently Asked Questions",
                items: [
                    {
                        question: "How do I register?",
                        answer:
                            "To register, click the 'Register' button in the top right corner and follow the instructions. You will need to provide personal information and contact details.",
                    },
                    {
                        question: "How much does it cost to participate?",
                        answer:
                            "Auction fees depend on the specific auction (Copart, IAAI) and the vehicle's value. Detailed estimates can be found on our Calculator page.",
                    },
                    {
                        question: "How long does shipping take?",
                        answer:
                            "Shipping time depends on the location. On average, shipping from the USA to Georgia takes 6-8 weeks.",
                    },
                    {
                        question: "How do I check vehicle history?",
                        answer:
                            "We offer Carfax services. You can enter the VIN code in the appropriate field to receive a detailed vehicle history report.",
                    },
                    {
                        question: "Can I return a purchased vehicle?",
                        answer:
                            "According to auction rules, purchased vehicles cannot be returned. Please carefully review the vehicle's condition before bidding.",
                    },
                ],
            },
            cta: {
                title: "Still need help?",
                subtitle: "Our team is ready to assist you",
                button: "Contact Us",
            },
        },
        ru: {
            hero: {
                title: "Центр помощи",
                subtitle: "Как мы можем помочь вам?",
                searchPlaceholder: "Поиск ответа...",
            },
            categories: {
                title: "Популярные темы",
                items: [
                    {
                        title: "Начало работы",
                        description: "Регистрация и управление аккаунтом",
                        icon: "mdi:rocket-launch",
                    },
                    {
                        title: "Аукционы",
                        description: "Участие и торги",
                        icon: "mdi:gavel",
                    },
                    {
                        title: "Доставка",
                        description: "Транспортировка и сроки",
                        icon: "mdi:truck-delivery",
                    },
                    {
                        title: "Оплата",
                        description: "Платежи и инвойсы",
                        icon: "mdi:credit-card-outline",
                    },
                ],
            },
            faq: {
                title: "Часто задаваемые вопросы",
                items: [
                    {
                        question: "Как зарегистрироваться?",
                        answer:
                            "Для регистрации нажмите кнопку 'Регистрация' в правом верхнем углу и следуйте инструкциям. Вам потребуется указать личные данные и контактный номер.",
                    },
                    {
                        question: "Сколько стоит участие в аукционе?",
                        answer:
                            "Сборы аукциона зависят от конкретной площадки (Copart, IAAI) и стоимости автомобиля. Подробную информацию можно найти на странице Калькулятора.",
                    },
                    {
                        question: "Сколько времени занимает доставка?",
                        answer:
                            "Срок доставки зависит от местоположения. В среднем доставка из США в Грузию занимает 6-8 недель.",
                    },
                    {
                        question: "Как проверить историю автомобиля?",
                        answer:
                            "Мы предлагаем сервис Carfax. Вы можете ввести VIN-код в соответствующее поле для получения подробного отчета об истории автомобиля.",
                    },
                    {
                        question: "Могу ли я вернуть купленный автомобиль?",
                        answer:
                            "Согласно правилам аукциона, приобретенные автомобили возврату не подлежат. Пожалуйста, внимательно ознакомьтесь с состоянием автомобиля перед покупкой.",
                    },
                ],
            },
            cta: {
                title: "Не нашли ответ?",
                subtitle: "Наша команда готова помочь",
                button: "Связаться с нами",
            },
        },
    };

    const getLanguage = (): string => {
        const lang = i18n.language?.substring(0, 2);
        if (lang && ['ka', 'en', 'ru'].includes(lang)) {
            return lang;
        }
        return "ka";
    };

    const currentLang = getLanguage();
    const content = translations[currentLang];

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative py-16 lg:py-24 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                <div className="relative container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-3xl lg:text-5xl font-bold text-white mb-4 uppercase tracking-tight">
                            {content.hero.title}
                        </h1>
                        <p className="text-lg text-slate-200 max-w-xl mx-auto mb-8">
                            {content.hero.subtitle}
                        </p>


                    </motion.div>
                </div>
            </section>



            {/* FAQ Section */}
            <section className="py-16 lg:py-24">
                <div className="container mx-auto px-4 max-w-3xl">
                    <div className="text-center mb-12">
                        <h2 className="text-2xl lg:text-3xl font-bold text-slate-900">
                            {content.faq.title}
                        </h2>
                    </div>

                    <div className="space-y-4">
                        {content.faq.items.map((item, index) => (
                            <div
                                key={index}
                                className="bg-white rounded-xl border border-slate-200 overflow-hidden"
                            >
                                <button
                                    onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                                    className="w-full flex items-center justify-between p-5 text-left bg-white hover:bg-slate-50 transition-colors"
                                >
                                    <span className="font-semibold text-slate-800">{item.question}</span>
                                    <motion.div
                                        animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Icon icon="mdi:chevron-down" className="text-slate-400" width="24" height="24" />
                                    </motion.div>
                                </button>
                                <AnimatePresence>
                                    {openFaqIndex === index && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="p-5 pt-0 text-slate-600 leading-relaxed border-t border-slate-100/50">
                                                {item.answer}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 bg-slate-100">
                <div className="container mx-auto px-4 text-center">
                    <div className="max-w-xl mx-auto bg-white rounded-3xl p-8 shadow-sm border border-slate-200">
                        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600">
                            <Icon icon="mdi:lifebuoy" width="32" height="32" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-2">
                            {content.cta.title}
                        </h3>
                        <p className="text-slate-600 mb-8">
                            {content.cta.subtitle}
                        </p>
                        <a
                            href="/contact"
                            className="inline-flex items-center justify-center px-8 py-3 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-colors shadow-lg hover:shadow-primary/20"
                        >
                            <Icon icon="mdi:email-outline" className="mr-2" width="20" height="20" />
                            {content.cta.button}
                        </a>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default HelpPage;

import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";

type ValueItem = {
    title: string;
    desc: string;
    icon: string;
};

type TranslationSection = {
    hero: {
        title: string;
        subtitle: string;
    };
    mission: {
        title: string;
        description: string;
    };
    values: {
        title: string;
        items: ValueItem[];
    };
    cta: {
        title: string;
        button: string;
    };
};

const AboutPage = () => {
    const { i18n } = useTranslation();

    // Note: For a real production app, move these to your locale JSON files.
    // Using inline dictionary for now to be self-contained as requested.
    const translations: Record<string, TranslationSection> = {
        ka: {
            hero: {
                title: "ჩვენს შესახებ",
                subtitle: "თქვენი სანდო პარტნიორი ავტოიმპორტში",
            },
            mission: {
                title: "ჩვენი მისია",
                description:
                    "ჩვენი მიზანია გავამარტივოთ ავტომობილების იმპორტის პროცესი და გავხადოთ ის გამჭვირვალე, სანდო და ხელმისაწვდომი ყველასთვის. ჩვენ ვქმნით ხიდს გლობალურ აუქციონებსა და ადგილობრივ მომხმარებლებს შორის.",
            },
            values: {
                title: "ჩვენი ღირებულებები",
                items: [
                    {
                        title: "სანდოობა",
                        desc: "ჩვენ ვმოქმედებთ სრული პასუხისმგებლობით და გამჭვირვალობით.",
                        icon: "mdi:shield-check",
                    },
                    {
                        title: "ხარისხი",
                        desc: "ჩვენ გთავაზობთ მხოლოდ შემოწმებულ და საუკეთესო სერვისს.",
                        icon: "mdi:star-circle",
                    },
                    {
                        title: "ინოვაცია",
                        desc: "ჩვენ მუდმივად ვნერგავთ თანამედროვე ტექნოლოგიებს.",
                        icon: "mdi:lightbulb",
                    },
                    {
                        title: "მხარდაჭერა",
                        desc: "ჩვენი გუნდი მუდამ თქვენს გვერდითაა პროცესის ნებისმიერ ეტაპზე.",
                        icon: "mdi:handshake",
                    },
                ],
            },
            cta: {
                title: "დაიწყე იმპორტი დღესვე",
                button: "იხილეთ აუქციონები",
            },
        },
        en: {
            hero: {
                title: "About Us",
                subtitle: "Your Trusted Partner in Auto Import",
            },
            mission: {
                title: "Our Mission",
                description:
                    "Our goal is to simplify the car import process and make it transparent, reliable, and accessible to everyone. We bridge the gap between global auctions and local customers.",
            },
            values: {
                title: "Our Values",
                items: [
                    {
                        title: "Trust",
                        desc: "We operate with complete responsibility and transparency.",
                        icon: "mdi:shield-check",
                    },
                    {
                        title: "Quality",
                        desc: "We offer only verified and high-quality service.",
                        icon: "mdi:star-circle",
                    },
                    {
                        title: "Innovation",
                        desc: "We constantly implement modern technologies.",
                        icon: "mdi:lightbulb",
                    },
                    {
                        title: "Support",
                        desc: "Our team is always by your side at any stage of the process.",
                        icon: "mdi:handshake",
                    },
                ],
            },
            cta: {
                title: "Start Importing Today",
                button: "View Auctions",
            },
        },
        ru: {
            hero: {
                title: "О нас",
                subtitle: "Ваш надежный партнер в автоимпорте",
            },
            mission: {
                title: "Наша миссия",
                description:
                    "Наша цель — упростить процесс импорта автомобилей и сделать его прозрачным, надежным и доступным для всех. Мы создаем мост между глобальными аукционами и местными клиентами.",
            },
            values: {
                title: "Наши ценности",
                items: [
                    {
                        title: "Надежность",
                        desc: "Мы действуем с полной ответственностью и прозрачностью.",
                        icon: "mdi:shield-check",
                    },
                    {
                        title: "Качество",
                        desc: "Мы предлагаем только проверенный и качественный сервис.",
                        icon: "mdi:star-circle",
                    },
                    {
                        title: "Инновации",
                        desc: "Мы постоянно внедряем современные технологии.",
                        icon: "mdi:lightbulb",
                    },
                    {
                        title: "Поддержка",
                        desc: "Наша команда всегда рядом на любом этапе процесса.",
                        icon: "mdi:handshake",
                    },
                ],
            },
            cta: {
                title: "Начните импорт сегодня",
                button: "Смотреть аукционы",
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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.2 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                <div className="relative container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-4xl lg:text-6xl font-bold text-white mb-6 uppercase tracking-tight">
                            {content.hero.title}
                        </h1>
                        <p className="text-xl text-slate-200 max-w-2xl mx-auto">
                            {content.hero.subtitle}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Mission Section */}
            <section className="py-16 lg:py-24">
                <div className="container mx-auto px-4">
                    <div className="max-w-4xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-slate-900 mb-8">
                            {content.mission.title}
                        </h2>
                        <p className="text-lg lg:text-xl text-slate-600 leading-relaxed">
                            {content.mission.description}
                        </p>
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl font-bold text-center text-slate-900 mb-16">
                        {content.values.title}
                    </h2>
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
                    >
                        {content.values.items.map((item, index) => (
                            <motion.div
                                key={index}
                                variants={itemVariants}
                                className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                            >
                                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 text-primary">
                                    <Icon icon={item.icon} width="32" height="32" />
                                </div>
                                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                                    {item.title}
                                </h3>
                                <p className="text-slate-600 text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-primary/5">
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-slate-900 mb-8">
                        {content.cta.title}
                    </h2>
                    <a
                        href="/auction-listings"
                        className="inline-flex items-center justify-center px-8 py-4 bg-accent hover:bg-accent/90 text-primary font-bold rounded-lg transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                    >
                        {content.cta.button}
                    </a>
                </div>
            </section>
        </div>
    );
};

export default AboutPage;

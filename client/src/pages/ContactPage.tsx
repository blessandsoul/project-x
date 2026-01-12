import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { Icon } from "@iconify/react/dist/iconify.js";

type ContactInfo = {
    title: string;
    details: string[];
    icon: string;
    action?: {
        label: string;
        href: string;
    };
};

type FormLabels = {
    name: string;
    email: string;
    subject: string;
    message: string;
    submit: string;
};

type TranslationSection = {
    hero: {
        title: string;
        subtitle: string;
    };
    info: {
        title: string;
        items: ContactInfo[];
    };
    form: {
        title: string;
        subtitle: string;
        labels: FormLabels;
    };
};

const ContactPage = () => {
    const { i18n } = useTranslation();

    const translations: Record<string, TranslationSection> = {
        ka: {
            hero: {
                title: "კონტაქტი",
                subtitle: "ჩვენ მზად ვართ გიპასუხოთ ნებისმიერ შეკითხვაზე",
            },
            info: {
                title: "საკონტაქტო ინფორმაცია",
                items: [
                    {
                        title: "მისამართი",
                        details: ["თბილისი, საქართველო", "აღმაშენებლის ხეივანი #12"],
                        icon: "mdi:map-marker",
                        action: { label: "რუკაზე ნახვა", href: "https://maps.google.com" },
                    },
                    {
                        title: "ტელეფონი",
                        details: ["+995 32 2 12 34 56", "+995 555 12 34 56"],
                        icon: "mdi:phone",
                        action: { label: "დარეკვა", href: "tel:+995322123456" },
                    },
                    {
                        title: "ელ-ფოსტა",
                        details: ["info@trustedimporters.ge", "support@trustedimporters.ge"],
                        icon: "mdi:email",
                        action: { label: "მოგვწერეთ", href: "mailto:info@trustedimporters.ge" },
                    },
                    {
                        title: "სამუშაო საათები",
                        details: ["ორშ - პარ: 10:00 - 19:00", "შაბათი: 11:00 - 16:00"],
                        icon: "mdi:clock-outline",
                    },
                ],
            },
            form: {
                title: "მოგვწერეთ",
                subtitle: "შეავსეთ ფორმა და ჩვენი გუნდი დაგიკავშირდებათ უმოკლეს დროში",
                labels: {
                    name: "სახელი, გვარი",
                    email: "ელ-ფოსტა",
                    subject: "თემა",
                    message: "შეტყობინება",
                    submit: "გაგზავნა",
                },
            },
        },
        en: {
            hero: {
                title: "Contact Us",
                subtitle: "We are ready to answer any questions you may have",
            },
            info: {
                title: "Contact Information",
                items: [
                    {
                        title: "Address",
                        details: ["Tbilisi, Georgia", "Aghmashenebeli Alley #12"],
                        icon: "mdi:map-marker",
                        action: { label: "View on Map", href: "https://maps.google.com" },
                    },
                    {
                        title: "Phone",
                        details: ["+995 32 2 12 34 56", "+995 555 12 34 56"],
                        icon: "mdi:phone",
                        action: { label: "Call Now", href: "tel:+995322123456" },
                    },
                    {
                        title: "Email",
                        details: ["info@trustedimporters.ge", "support@trustedimporters.ge"],
                        icon: "mdi:email",
                        action: { label: "Send Email", href: "mailto:info@trustedimporters.ge" },
                    },
                    {
                        title: "Working Hours",
                        details: ["Mon - Fri: 10:00 - 19:00", "Saturday: 11:00 - 16:00"],
                        icon: "mdi:clock-outline",
                    },
                ],
            },
            form: {
                title: "Send Message",
                subtitle: "Fill out the form and our team will contact you shortly",
                labels: {
                    name: "Full Name",
                    email: "Email Address",
                    subject: "Subject",
                    message: "Message",
                    submit: "Send Message",
                },
            },
        },
        ru: {
            hero: {
                title: "Контакты",
                subtitle: "Мы готовы ответить на любые ваши вопросы",
            },
            info: {
                title: "Контактная информация",
                items: [
                    {
                        title: "Адрес",
                        details: ["Тбилиси, Грузия", "Аллея Агмашенебели #12"],
                        icon: "mdi:map-marker",
                        action: { label: "На карте", href: "https://maps.google.com" },
                    },
                    {
                        title: "Телефон",
                        details: ["+995 32 2 12 34 56", "+995 555 12 34 56"],
                        icon: "mdi:phone",
                        action: { label: "Позвонить", href: "tel:+995322123456" },
                    },
                    {
                        title: "Email",
                        details: ["info@trustedimporters.ge", "support@trustedimporters.ge"],
                        icon: "mdi:email",
                        action: { label: "Написать", href: "mailto:info@trustedimporters.ge" },
                    },
                    {
                        title: "Рабочие часы",
                        details: ["Пн - Пт: 10:00 - 19:00", "Суббота: 11:00 - 16:00"],
                        icon: "mdi:clock-outline",
                    },
                ],
            },
            form: {
                title: "Напишите нам",
                subtitle: "Заполните форму и наша команда свяжется с вами в ближайшее время",
                labels: {
                    name: "ФИО",
                    email: "Электронная почта",
                    subject: "Тема",
                    message: "Сообщение",
                    submit: "Отправить",
                },
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
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Hero Section */}
            <section className="relative py-20 bg-primary overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(#ffffff1a_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                <div className="relative container mx-auto px-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4 uppercase tracking-tight">
                            {content.hero.title}
                        </h1>
                        <p className="text-xl text-slate-200 max-w-2xl mx-auto">
                            {content.hero.subtitle}
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
                    {/* Contact Info (Left Column) */}
                    <div className="lg:col-span-1 space-y-8">
                        <h2 className="text-2xl font-bold text-slate-900 border-l-4 border-accent pl-4">
                            {content.info.title}
                        </h2>
                        <motion.div
                            variants={containerVariants}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="space-y-6"
                        >
                            {content.info.items.map((item, index) => (
                                <motion.div
                                    key={index}
                                    variants={itemVariants}
                                    className="flex items-start space-x-4 p-6 bg-white rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                                        <Icon icon={item.icon} width="24" height="24" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-slate-900 mb-1">{item.title}</h3>
                                        <div className="space-y-1 mb-3">
                                            {item.details.map((detail, idx) => (
                                                <p key={idx} className="text-slate-600 text-sm">{detail}</p>
                                            ))}
                                        </div>
                                        {item.action && (
                                            <a
                                                href={item.action.href}
                                                className="text-primary text-sm font-medium hover:text-accent transition-colors inline-flex items-center gap-1"
                                            >
                                                {item.action.label}
                                                <Icon icon="mdi:arrow-right" width="16" height="16" />
                                            </a>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>

                    {/* Contact Form (Right Column) */}
                    <div className="lg:col-span-2">
                        <motion.div
                            initial={{ opacity: 0, x: 20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 lg:p-10"
                        >
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                    {content.form.title}
                                </h2>
                                <p className="text-slate-500">
                                    {content.form.subtitle}
                                </p>
                            </div>

                            <form className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            {content.form.labels.name}
                                        </label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            {content.form.labels.email}
                                        </label>
                                        <input
                                            type="email"
                                            className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        {content.form.labels.subject}
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        {content.form.labels.message}
                                    </label>
                                    <textarea
                                        rows={5}
                                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="button"
                                    className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg transform active:scale-[0.99] flex items-center justify-center gap-2"
                                >
                                    <Icon icon="mdi:send" width="18" height="18" />
                                    {content.form.labels.submit}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;

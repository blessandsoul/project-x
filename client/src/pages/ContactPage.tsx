import { useState } from "react";
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
    sending: string;
    successTitle: string;
    successMessage: string;
    validation: {
        required: string;
        emailInvalid: string;
    };
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
                    sending: "იგზავნება...",
                    successTitle: "შეტყობინება გაგზავნილია!",
                    successMessage: "მადლობა დაკავშირებისთვის. ჩვენ მალე გიპასუხებთ.",
                    validation: {
                        required: "ველი სავალდებულოა",
                        emailInvalid: "არასწორი ელ-ფოსტის ფორმატი",
                    },
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
                    sending: "Sending...",
                    successTitle: "Message Sent!",
                    successMessage: "Thank you for contacting us. We will get back to you shortly.",
                    validation: {
                        required: "This field is required",
                        emailInvalid: "Invalid email format",
                    },
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
                    sending: "Отправка...",
                    successTitle: "Сообщение отправлено!",
                    successMessage: "Спасибо за обращение. Мы свяжемся с вами в ближайшее время.",
                    validation: {
                        required: "Поле обязательно для заполнения",
                        emailInvalid: "Неверный формат email",
                    },
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

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: ""
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.name.trim()) newErrors.name = content.form.labels.validation.required;
        if (!formData.email.trim()) {
            newErrors.email = content.form.labels.validation.required;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = content.form.labels.validation.emailInvalid;
        }
        if (!formData.subject.trim()) newErrors.subject = content.form.labels.validation.required;
        if (!formData.message.trim()) newErrors.message = content.form.labels.validation.required;

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (validateForm()) {
            setIsSubmitting(true);
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));
            setIsSubmitting(false);
            setIsSuccess(true);
            setFormData({ name: "", email: "", subject: "", message: "" });
            setErrors({});
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: "" }));
        }
    };

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
                            {isSuccess ? (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-center py-12"
                                >
                                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Icon icon="mdi:check-circle" width="48" height="48" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-slate-900 mb-2">
                                        {content.form.labels.successTitle}
                                    </h3>
                                    <p className="text-slate-600 mb-8">
                                        {content.form.labels.successMessage}
                                    </p>
                                    <button
                                        onClick={() => setIsSuccess(false)}
                                        className="text-primary font-medium hover:text-primary/80 transition-colors"
                                    >
                                        {content.form.subtitle}
                                    </button>
                                </motion.div>
                            ) : (
                                <>
                                    <div className="mb-8">
                                        <h2 className="text-2xl font-bold text-slate-900 mb-2">
                                            {content.form.title}
                                        </h2>
                                        <p className="text-slate-500">
                                            {content.form.subtitle}
                                        </p>
                                    </div>

                                    <form onSubmit={handleSubmit} className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {content.form.labels.name} <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        name="name"
                                                        value={formData.name}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-2 bg-slate-50 border ${errors.name ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                                                    />
                                                    {errors.name && (
                                                        <p className="text-red-500 text-xs mt-1 absolute">{errors.name}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium text-slate-700">
                                                    {content.form.labels.email} <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="email"
                                                        name="email"
                                                        value={formData.email}
                                                        onChange={handleChange}
                                                        className={`w-full px-4 py-2 bg-slate-50 border ${errors.email ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                                                    />
                                                    {errors.email && (
                                                        <p className="text-red-500 text-xs mt-1 absolute">{errors.email}</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {content.form.labels.subject} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    name="subject"
                                                    value={formData.subject}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-2 bg-slate-50 border ${errors.subject ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all`}
                                                />
                                                {errors.subject && (
                                                    <p className="text-red-500 text-xs mt-1 absolute">{errors.subject}</p>
                                                )}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-sm font-medium text-slate-700">
                                                {content.form.labels.message} <span className="text-red-500">*</span>
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    name="message"
                                                    rows={5}
                                                    value={formData.message}
                                                    onChange={handleChange}
                                                    className={`w-full px-4 py-2 bg-slate-50 border ${errors.message ? 'border-red-500' : 'border-slate-200'} rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none`}
                                                ></textarea>
                                                {errors.message && (
                                                    <p className="text-red-500 text-xs mt-1 absolute">{errors.message}</p>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="submit"
                                            disabled={isSubmitting}
                                            className="w-full bg-primary text-white font-bold py-3 rounded-lg hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg transform active:scale-[0.99] flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Icon icon="mdi:loading" className="animate-spin" width="18" height="18" />
                                                    {content.form.labels.sending}
                                                </>
                                            ) : (
                                                <>
                                                    <Icon icon="mdi:send" width="18" height="18" />
                                                    {content.form.labels.submit}
                                                </>
                                            )}
                                        </button>
                                    </form>
                                </>
                            )}
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ContactPage;

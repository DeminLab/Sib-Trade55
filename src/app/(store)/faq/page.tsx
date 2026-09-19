import type { Metadata } from "next"
import Link from "next/link"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export const metadata: Metadata = {
  title: "Часто задаваемые вопросы",
  description: "Ответы на вопросы о товарах, доставке, оплате и возврате.",
}

const faqs = [
  {
    question: "Какие сроки доставки?",
    answer:
      "По Новосибирску — 1-3 рабочих дня. По Новосибирской области — 3-7 рабочих дней. По России — рассчитывается индивидуально при оформлении заказа.",
  },
  {
    question: "Можно ли вернуть товар?",
    answer:
      "Да, мы принимаем возврат в течение 14 дней. Товар должен быть в nguyênой упаковке и без следов использования. Металлоконструкции по индивидуальному заказу — возврату не подлежат.",
  },
  {
    question: "Какие способы оплаты вы принимаете?",
    answer:
      "Наличный расчёт, безналичный расчёт (для юридических лиц с НДС), перевод на карту, рассрочка для постоянных клиентов.",
  },
  {
    question: "Предоставляете ли вы гарантию?",
    answer:
      "На металлоконструкции — от 3 до 10 лет в зависимости от типа. На сантехнику — гарантия производителя (обычно 1-5 лет). На стройматериалы — соответствие ГОСТ.",
  },
  {
    question: "Можно ли заказать металлоконструкцию по индивидуальным размерам?",
    answer:
      "Конечно! Мы подбираем и поставляем лестницы, ворота, заборы, навесы и другие конструкции по вашим размерам. Выезд замерщика бесплатный по Новосибирску.",
  },
  {
    question: "Работаете ли вы с юридическими лицами?",
    answer:
      "Да, работаем с организациями всех форм собственности. Предоставляем полный пакет документов, счета-фактуры, акты. Возможна отсрочка платежа для постоянных клиентов.",
  },
  {
    question: "Как рассчитать стоимость доставки?",
    answer:
      "По Новосибирску — 500 ₽, бесплатная доставка от 50 000 ₽. По области и России — стоимость рассчитывается менеджером в зависимости от объёма и расстояния. Позвоните нам для точного расчёта.",
  },
  {
    question: "Можно ли забрать заказ самовывозом?",
    answer:
      "Да, самовывоз доступен с пн по пт с 9:00 до 18:00 по адресу: г. Новосибирск, ул. Промышленная, 15. Предварительно согласуйте забор с менеджером.",
  },
]

export default function FAQPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-bold tracking-tight">
        Часто задаваемые вопросы
      </h1>
      <p className="mt-4 text-muted-foreground">
        Ответы на популярные вопросы о наших товарах, доставке и условиях работы.
      </p>

      <Accordion className="mt-8">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">
              {faq.question}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground">
              {faq.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>

      <div className="mt-12 rounded-lg border bg-neutral-50 p-6 text-center">
        <h2 className="text-lg font-semibold">Остались вопросы?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Не нашли ответ? Наши специалисты готовы помочь.
        </p>
        <Link
          href="/contact"
          className="mt-4 inline-block text-sm font-medium underline hover:text-foreground"
        >
          Связаться с нами
        </Link>
      </div>
    </div>
  )
}

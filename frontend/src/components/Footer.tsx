import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-white text-[#0046EA] py-24 border-t border-[#0046EA]/20">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">

                    {/* Branding */}
                    <div className="space-y-10">
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 border border-[#FFE900]/30 flex items-center justify-center text-[#FFE900] group-hover:bg-[#FFE900] group-hover:text-[#171716] transition-all duration-700">
                                <span className="font-garamond text-xl">V</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-garamond text-[#0046EA] text-2xl tracking-[0.2em] font-light lowercase">voca.</span>
                                <span className="font-inter text-[#0046EA] text-[8px] tracking-[0.5em] uppercase mt-1 opacity-80 font-bold">The Standard</span>
                            </div>
                        </Link>
                        <p className="text-xs leading-[2] font-medium tracking-wide uppercase text-[#0046EA]/80">
                            Nơi khẳng định giá trị và tìm thấy chuẩn mực chính xác của bản thân trên hành trình sự nghiệp.
                        </p>
                        <div className="space-y-4 text-[11px] tracking-widest uppercase italic font-medium text-[#0046EA]">
                            <p className="flex items-center gap-3"><MapPin size={12} color="#0046EA" /> TP. HCM, Việt Nam</p>
                            <p className="flex items-center gap-3"><Phone size={12} color="#0046EA" /> 1900 1234</p>
                            <p className="flex items-center gap-3"><Mail size={12} color="#0046EA" /> contact@voca.vn</p>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-8">
                        <h4 className="text-[#0046EA] font-garamond text-xl italic font-bold tracking-wide">Giải pháp</h4>
                        <ul className="space-y-5 text-[11px] tracking-[0.2em] uppercase font-medium text-[#0046EA]/80">
                            <li><Link href="/dashboard/roadmap" className="hover:text-[#171716] transition-colors">Hành trình Ikigai</Link></li>
                            <li><Link href="/ai-tools" className="hover:text-[#171716] transition-colors">AI Mock Interview</Link></li>
                            <li><Link href="/dashboard/experts" className="hover:text-[#171716] transition-colors">Sàn Mentor</Link></li>
                            <li><Link href="/pricing" className="hover:text-[#171716] transition-colors">Thành viên</Link></li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div className="space-y-8">
                        <h4 className="text-[#0046EA] font-garamond text-xl italic font-bold tracking-wide">Đặc quyền</h4>
                        <ul className="space-y-5 text-[11px] tracking-[0.2em] uppercase font-medium text-[#0046EA]/80">
                            <li><Link href="/terms" className="hover:text-[#171716] transition-colors">Điều khoản</Link></li>
                            <li><Link href="/privacy" className="hover:text-[#171716] transition-colors">Bảo mật</Link></li>
                            <li><Link href="/refund-policy" className="hover:text-[#171716] transition-colors">Chính sách Hoàn tiền</Link></li>
                            <li><Link href="/faq" className="hover:text-[#171716] transition-colors">Hỗ trợ (FAQ)</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-8">
                        <h4 className="text-[#0046EA] font-garamond text-xl italic font-bold tracking-wide">Bản tin</h4>
                        <p className="text-xs font-medium leading-relaxed text-[#0046EA]/80">Nhận những phân tích mới nhất về thị trường sự nghiệp cao cấp.</p>
                        <div className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="EMAIL CỦA BẠN"
                                suppressHydrationWarning
                                className="bg-transparent border-b border-[#0046EA]/30 py-3 text-[10px] tracking-[0.3em] uppercase focus:border-[#0046EA] text-[#0046EA] placeholder:text-[#0046EA]/50 outline-none transition-all duration-700"
                            />
                            <button
                                suppressHydrationWarning
                                className="bg-[#0046EA] text-white py-4 text-[10px] tracking-[0.4em] uppercase font-bold hover:bg-[#171716] transition-all duration-700"
                            >
                                ĐĂNG KÝ
                            </button>
                        </div>
                        <div className="flex gap-8 pt-4">
                            {[
                                { name: 'Facebook', Icon: Facebook },
                                { name: 'LinkedIn', Icon: Linkedin },
                                { name: 'Youtube', Icon: Youtube }
                            ].map(({ name, Icon }) => (
                                <a
                                    key={name}
                                    href="#"
                                    aria-label={`Theo dõi trên ${name}`}
                                    className="opacity-60 hover:opacity-100 transition-opacity duration-700"
                                >
                                    <Icon size={16} color="#0046EA" strokeWidth={1.5} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-[#0046EA]/20 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-medium tracking-[0.2em] uppercase text-[#0046EA]/60">© {year} VOCA — THE STANDARD. RESERVED.</p>
                    <div className="flex gap-8 text-[10px] font-medium tracking-[0.2em] uppercase">
                        <span className="flex items-center gap-3 text-[#0046EA]/60">
                            <div className="w-[4px] h-[4px] bg-[#0046EA] rounded-full animate-pulse" />
                            System Active
                        </span>
                    </div>
                </div>
            </div>
        </footer>

    );
}

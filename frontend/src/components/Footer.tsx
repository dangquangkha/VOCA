import Link from 'next/link';
import { Mail, Phone, MapPin, Facebook, Linkedin, Youtube } from 'lucide-react';

export function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="bg-[#0D1B2A] text-[#F5F0E8]/60 py-24 border-t border-[#C9A84C]/10">
            <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">

                    {/* Branding */}
                    <div className="space-y-10">
                        <Link href="/" className="flex items-center gap-4 group">
                            <div className="w-10 h-10 border border-[#C9A84C]/30 flex items-center justify-center text-[#C9A84C] group-hover:bg-[#C9A84C] group-hover:text-[#0D1B2A] transition-all duration-700">
                                <span className="font-garamond text-xl">V</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="font-garamond text-white text-2xl tracking-[0.2em] font-light lowercase">voca.</span>
                                <span className="font-inter text-[#C9A84C] text-[8px] tracking-[0.5em] uppercase mt-1 opacity-60">The Standard</span>
                            </div>
                        </Link>
                        <p className="text-xs leading-[2] font-light tracking-wide uppercase opacity-70">
                            Nơi khẳng định giá trị và tìm thấy chuẩn mực chính xác của bản thân trên hành trình sự nghiệp.
                        </p>
                        <div className="space-y-4 text-[11px] tracking-widest uppercase italic font-light">
                            <p className="flex items-center gap-3"><MapPin size={12} color="#C9A84C" /> TP. HCM, Việt Nam</p>
                            <p className="flex items-center gap-3"><Phone size={12} color="#C9A84C" /> 1900 1234</p>
                            <p className="flex items-center gap-3"><Mail size={12} color="#C9A84C" /> contact@voca.vn</p>
                        </div>
                    </div>

                    {/* Products */}
                    <div className="space-y-8">
                        <h4 className="text-[#C9A84C] font-garamond text-xl italic font-normal tracking-wide">Giải pháp</h4>
                        <ul className="space-y-5 text-[11px] tracking-[0.2em] uppercase font-light">
                            <li><Link href="/dashboard/roadmap" className="hover:text-[#C9A84C] transition-colors">Hành trình Ikigai</Link></li>
                            <li><Link href="/ai-tools" className="hover:text-[#C9A84C] transition-colors">AI Mock Interview</Link></li>
                            <li><Link href="/dashboard/experts" className="hover:text-[#C9A84C] transition-colors">Sàn Mentor</Link></li>
                            <li><Link href="/pricing" className="hover:text-[#C9A84C] transition-colors">Thành viên</Link></li>
                        </ul>
                    </div>

                    {/* Policies */}
                    <div className="space-y-8">
                        <h4 className="text-[#C9A84C] font-garamond text-xl italic font-normal tracking-wide">Đặc quyền</h4>
                        <ul className="space-y-5 text-[11px] tracking-[0.2em] uppercase font-light">
                            <li><Link href="/terms" className="hover:text-[#C9A84C] transition-colors">Điều khoản</Link></li>
                            <li><Link href="/privacy" className="hover:text-[#C9A84C] transition-colors">Bảo mật</Link></li>
                            <li><Link href="/refund-policy" className="hover:text-[#C9A84C] transition-colors">Chính sách Hoàn tiền</Link></li>
                            <li><Link href="/faq" className="hover:text-[#C9A84C] transition-colors">Hỗ trợ (FAQ)</Link></li>
                        </ul>
                    </div>

                    {/* Newsletter */}
                    <div className="space-y-8">
                        <h4 className="text-[#C9A84C] font-garamond text-xl italic font-normal tracking-wide">Bản tin</h4>
                        <p className="text-xs font-light leading-relaxed">Nhận những phân tích mới nhất về thị trường sự nghiệp cao cấp.</p>
                        <div className="flex flex-col gap-4">
                            <input
                                type="email"
                                placeholder="EMAIL CỦA BẠN"
                                suppressHydrationWarning
                                className="bg-transparent border-b border-[#C9A84C]/20 py-3 text-[10px] tracking-[0.3em] uppercase focus:border-[#C9A84C] outline-none transition-all duration-700"
                            />
                            <button
                                suppressHydrationWarning
                                className="bg-[#58181F] text-[#F5F0E8] py-4 text-[10px] tracking-[0.4em] uppercase hover:bg-white hover:text-[#58181F] transition-all duration-700"
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
                                    className="opacity-40 hover:opacity-100 transition-opacity duration-700"
                                >
                                    <Icon size={16} color="#C9A84C" strokeWidth={1} />
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="pt-12 border-t border-[#C9A84C]/10 flex flex-col md:flex-row justify-between items-center gap-8">
                    <p className="text-[10px] font-light tracking-[0.2em] uppercase opacity-40">© {year} VOCA — THE STANDARD. RESERVED.</p>
                    <div className="flex gap-8 text-[10px] font-light tracking-[0.2em] uppercase opacity-40">
                        <span className="flex items-center gap-3">
                            <div className="w-[4px] h-[4px] bg-[#C9A84C] rounded-full animate-pulse" />
                            System Active
                        </span>
                    </div>
                </div>
            </div>
        </footer>
    );
}

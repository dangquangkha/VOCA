import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from backend.app.db.session import AsyncSessionLocal, engine
from backend.app.domains.mbti.models import MBTIQuestion, MBTIType, UserMBTIResult
from backend.app.db.base import Base
from sqlalchemy import select

async def seed_mbti():
    # Create tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Ensure new columns exist for existing tables
        from sqlalchemy import text
        try:
            await conn.execute(text("ALTER TABLE mbti_questions ADD COLUMN IF NOT EXISTS option_a_text TEXT"))
            await conn.execute(text("ALTER TABLE mbti_questions ADD COLUMN IF NOT EXISTS option_b_text TEXT"))
            # Ensure UserMBTIResult columns exist
            cols = ["score_e", "score_i", "score_s", "score_n", "score_t", "score_f", "score_j", "score_p"]
            for col in cols:
                await conn.execute(text(f"ALTER TABLE user_mbti_results ADD COLUMN IF NOT EXISTS {col} INTEGER DEFAULT 0"))
        except Exception as e:
            print(f"Schema update notice: {e}")
    
    async with AsyncSessionLocal() as db:
        # 1. Seed MBTI Types
        types_data = [
            {
                "code": "ENFJ",
                "title": "The Teacher",
                "vietnamese_title": "Người Chỉ Dạy",
                "population_pct": "2%",
                "description": "ENFJ là những người có khả năng lãnh đạo tự nhiên và truyền cảm hứng cho người khác. Họ rất đồng cảm và quan tâm đến mọi người xung quanh.",
                "pros": ["Giỏi giao tiếp và thấu hiểu người khác", "Lòng trắc ẩn và vị tha", "Khả năng lãnh đạo và truyền cảm hứng", "Sáng tạo và đổi mới"],
                "cons": ["Quá nhạy cảm", "Quá vị tha", "Thường xuyên lo lắng", "Khó nói không"],
                "suggested_careers": "Giáo dục, tư vấn và quản lý dự án."
            },
            {
                "code": "ENFP",
                "title": "Campaigner",
                "vietnamese_title": "Người truyền cảm hứng",
                "population_pct": "7%",
                "description": "ENFP là những người sáng tạo lấy con người làm trọng tâm, họ tìm nguồn năng lượng từ ý tưởng, con người và những hoạt động mới.",
                "pros": ["Trí tưởng tượng phong phú", "Sáng tạo và đổi mới", "Giỏi giao tiếp và thấu hiểu người khác", "Lòng trắc ẩn và vị tha"],
                "cons": ["Hay mơ mộng", "Khó tập trung", "Thường xuyên thay đổi ý định", "Thường bị lợi dụng"],
                "suggested_careers": "Nghệ thuật, sáng tạo và truyền thông xã hội."
            },
            {
                "code": "ENTJ",
                "title": "Executive",
                "vietnamese_title": "Nhà Điều Hành",
                "population_pct": "3%",
                "description": "ENTJ có sức hấp dẫn mạnh mẽ, sự sắc sảo và tư duy lý trí đáng ngưỡng mộ. Họ xuất sắc trong việc dẫn dắt, truyền cảm hứng cho người khác.",
                "pros": ["Tự tin và quyết đoán", "Giỏi lãnh đạo và truyền cảm hứng", "Tư duy chiến lược và sáng tạo", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Thích kiểm soát", "Khó chịu đựng sự thất bại", "Hay mải mê với công việc", "Thường xuyên bị căng thẳng"],
                "suggested_careers": "Luật sư, công nghệ thông tin và quản lý rủi ro."
            },
            {
                "code": "ENTP",
                "title": "The Inventor",
                "vietnamese_title": "Người Phát Minh",
                "population_pct": "3%",
                "description": "ENTP được miêu tả là có sự thông minh, khả năng giao tiếp rộng, tính sáng tạo, tinh thần linh hoạt và tháo vát.",
                "pros": ["Tư duy sáng tạo và độc đáo", "Giỏi giao tiếp và thuyết phục", "Lòng ham học hỏi và khám phá", "Giỏi giải quyết vấn đề"],
                "cons": ["Hay mơ mộng", "Thường xuyên thay đổi ý định", "Khó tập trung", "Hay tranh luận"],
                "suggested_careers": "Khoa học, kỹ thuật và giáo dục."
            },
            {
                "code": "ESFJ",
                "title": "The Consul",
                "vietnamese_title": "Người Lãnh Sự",
                "population_pct": "12%",
                "description": "ESFJ thường trung thành, chăm chỉ, tận tâm và tử tế. Họ thích làm việc trong môi trường hợp tác và có khả năng tương tác xã hội tốt.",
                "pros": ["Thân thiện và hòa đồng", "Giỏi giao tiếp và thấu hiểu người khác", "Lòng trắc ẩn và vị tha", "Tận tâm và trách nhiệm"],
                "cons": ["Thích kiểm soát", "Hay lo lắng", "Dễ bị tổn thương", "Không thích thay đổi"],
                "suggested_careers": "Chăm sóc khách hàng, hành chính, quản lý nhân sự."
            },
            {
                "code": "ESFP",
                "title": "The Performer",
                "vietnamese_title": "Người Trình Diễn",
                "population_pct": "7.5%",
                "description": "ESFP mang tinh thần thực tế, không thích sự rập khuôn. Họ tin tưởng vào khả năng ứng biến của mình trong mọi tình huống.",
                "pros": ["Nhiệt tình và vui vẻ", "Giỏi giao tiếp và thấu hiểu người khác", "Lòng trắc ẩn và vị tha", "Sáng tạo và đổi mới"],
                "cons": ["Thường xuyên thay đổi ý định", "Khó tập trung", "Dễ bị tổn thương", "Không thích kế hoạch"],
                "suggested_careers": "Giải trí, bán hàng, dịch vụ khách hàng."
            },
            {
                "code": "ESTJ",
                "title": "The Supervisor",
                "vietnamese_title": "Người Giám Sát",
                "population_pct": "11.5%",
                "description": "ESTJ dựa vào thông tin khách quan và logic để đưa ra quyết định. Họ có khả năng đưa ra quyết định minh bạch và công bằng.",
                "pros": ["Tự tin và quyết đoán", "Giỏi tổ chức và quản lý", "Làm việc chăm chỉ và hiệu quả", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Cứng nhắc và kiểm soát", "Ít linh hoạt và thích nghi", "Không thích rủi ro", "Thường xuyên phê bình"],
                "suggested_careers": "Quản lý doanh nghiệp, quân đội, thực thi pháp luật."
            },
            {
                "code": "ESTP",
                "title": "The Promoter",
                "vietnamese_title": "Người Đề Xướng",
                "population_pct": "4%",
                "description": "ESTP mang đến thế giới sự năng động, nhiệt tình và những quan điểm độc đáo. Họ thích sự ngẫu hứng và thẳng thắn.",
                "pros": ["Hấp dẫn và lôi cuốn", "Tự tin và quyết đoán", "Thích phiêu lưu và mạo hiểm", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Không có tổ chức và kế hoạch", "Hay trì hoãn", "Thiếu kiên nhẫn", "Hay thay đổi ý định"],
                "suggested_careers": "Kinh doanh, marketing, thể thao, cấp cứu."
            },
            {
                "code": "INFJ",
                "title": "The Protector",
                "vietnamese_title": "Người Bảo Vệ",
                "population_pct": "1%",
                "description": "INFJ đam mê giúp đỡ người khác và là người lắng nghe tốt. Họ có cái nhìn sâu sắc về cuộc sống và tôn trọng ý kiến người khác.",
                "pros": ["Trực giác và thấu hiểu", "Lòng trắc ẩn và vị tha", "Sáng tạo và đổi mới", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Kín đáo và khó gần", "Thường xuyên suy nghĩ quá nhiều", "Hay bị tổn thương", "Khó ra quyết định"],
                "suggested_careers": "Tâm lý học, viết lách, công tác xã hội."
            },
            {
                "code": "INFP",
                "title": "The Mediator",
                "vietnamese_title": "Người Hòa Giải",
                "population_pct": "8%",
                "description": "INFP nhạy cảm, tư duy sáng tạo và tận hưởng sự tự do cá nhân. Họ có giá trị đạo đức cao và quan tâm đến người khác.",
                "pros": ["Tinh thần sáng tạo và nghệ thuật", "Lòng trắc ẩn và vị tha", "Trung thành và tận tụy", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Mơ mộng và xa rời thực tế", "Hay bị tổn thương", "Khó ra quyết định", "Hay lo lắng"],
                "suggested_careers": "Nghệ thuật, thiết kế, tâm lý học."
            },
            {
                "code": "INTJ",
                "title": "The Analyst",
                "vietnamese_title": "Người Phân Tích",
                "population_pct": "4%",
                "description": "INTJ kết hợp độc đáo giữa tính quyết đoán và trí tưởng tượng sống động. Họ xây dựng và thực hiện kế hoạch cực kỳ hiệu quả.",
                "pros": ["Tư duy logic và sáng tạo", "Tự tin và quyết đoán", "Tập trung và có mục tiêu rõ ràng", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Cứng nhắc và thiếu linh hoạt", "Kín đáo và khó gần", "Hay lo lắng và căng thẳng", "Thường xuyên phê bình"],
                "suggested_careers": "Kiến trúc sư, khoa học, kỹ sư phần mềm."
            },
            {
                "code": "INTP",
                "title": "The Logician",
                "vietnamese_title": "Nhà Logic Học",
                "population_pct": "3%",
                "description": "INTP thích dành thời gian một mình để suy ngẫm ý tưởng sâu sắc. Họ luôn tìm kiếm sự kết nối giữa các thông tin và nhìn xa trông rộng.",
                "pros": ["Tư duy logic và sáng tạo", "Tò mò và ham học hỏi", "Tự tin và độc lập", "Có khả năng lãnh đạo"],
                "cons": ["Kín đáo và khó gần", "Hay trì hoãn", "Không giỏi giao tiếp", "Thường xuyên phê bình"],
                "suggested_careers": "Khoa học, toán học, phân tích dữ liệu."
            },
            {
                "code": "ISFJ",
                "title": "The Nurturer",
                "vietnamese_title": "Người Nuôi Dưỡng",
                "population_pct": "12.5%",
                "description": "ISFJ vô cùng ấm áp và chu đáo. Họ có khả năng mang lại nhiều lợi ích cho bản thân, người khác và xã hội.",
                "pros": ["Tận tâm và chu đáo", "Lòng trắc ẩn và vị tha", "Trung thành và đáng tin cậy", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Có thể quá lo lắng", "Khó nói không", "Thiếu quyết đoán", "Dành nhiều thời gian suy nghĩ"],
                "suggested_careers": "Y tế, giáo dục mầm non, quản lý văn phòng."
            },
            {
                "code": "ISFP",
                "title": "The Artist",
                "vietnamese_title": "Người Nghệ Sĩ",
                "population_pct": "8%",
                "description": "ISFP có thẩm mỹ tinh tế, luôn tìm kiếm vẻ đẹp và xuất sắc trong việc thể hiện sự sáng tạo nghệ thuật bẩm sinh.",
                "pros": ["Thẩm mỹ và nghệ thuật", "Lòng trắc ẩn và vị tha", "Tự do và độc lập", "Giỏi giao tiếp và thuyết phục"],
                "cons": ["Có thể quá mơ mộng", "Hay bị tổn thương", "Thiếu quyết đoán", "Khó tuân theo quy tắc"],
                "suggested_careers": "Hội họa, thiết kế thời trang, làm vườn nghệ thuật."
            },
            {
                "code": "ISTJ",
                "title": "The Guardian",
                "vietnamese_title": "Người Giám Hộ",
                "population_pct": "13%",
                "description": "ISTJ đại diện cho sự trung thực, hướng nội và tổ chức. Họ tập trung hoàn thành nhiệm vụ hiệu quả và tận tâm với gia đình.",
                "pros": ["Tận tâm và chu đáo", "Lòng trắc ẩn và vị tha", "Trung thành và đáng tin cậy", "Giỏi tổ chức và quản lý"],
                "cons": ["Thiếu linh hoạt", "Có thể quá cứng nhắc", "Thường xuyên trì hoãn", "Hay lo lắng"],
                "suggested_careers": "Kế toán, quản lý tài chính, vận hành."
            },
            {
                "code": "ISTP",
                "title": "The Crafter",
                "vietnamese_title": "Thợ Thủ Công",
                "population_pct": "5%",
                "description": "ISTP linh hoạt và hay phá vỡ các nguyên tắc để thể hiện quan điểm. Họ không chấp nhận môi trường bị coi thường nguyên tắc cá nhân.",
                "pros": ["Trực quan và thực tế", "Tự tin và độc lập", "Khả năng giải quyết vấn đề cao", "Thích thử thách và mạo hiểm"],
                "cons": ["Thiếu kiên nhẫn", "Khó mở lòng với người khác", "Hay trì hoãn", "Có thể quá cứng nhắc"],
                "suggested_careers": "Kỹ thuật cơ khí, phi công, thợ mộc."
            }
        ]

        for t in types_data:
            existing = await db.execute(select(MBTIType).where(MBTIType.code == t["code"]))
            if not existing.scalars().first():
                db.add(MBTIType(**t))
        
        # 2. Seed MBTI Questions
        questions_raw = [
            ("Trong một buổi tiệc, bạn sẽ:", "Thoải mái trò chuyện với tất cả mọi người, kể cả người lạ", "Chỉ tương tác với những người bạn quen", "E", "I", "EI"),
            ("Bạn thiên về:", "Thực tế hơn là suy đoán", "Suy đoán hơn là thực tế", "S", "N", "SN"),
            ("Điều gì khiến bạn cảm thấy tệ hơn?", "Đầu óc trên mây, viển vông và phi thực tế", "Nhàm chán, đơn điệu", "S", "N", "SN"),
            ("Bạn thấy ấn tượng hơn bởi:", "Nguyên lý, nguyên tắc", "Cảm xúc, tình cảm", "T", "F", "TF"),
            ("Bạn dễ bị thuyết phục hơn bởi những sự việc:", "Logic, dựa trên bằng chứng và lý lẽ", "Cảm động, thiên về cảm xúc và tình người", "T", "F", "TF"),
            ("Bạn thích làm việc:", "Với thời hạn (deadline) rõ ràng", "Tùy hứng, linh hoạt", "J", "P", "JP"),
            ("Khi lựa chọn, bạn thường:", "Xem xét kỹ lưỡng từ nhiều khía cạnh", "Tin vào suy đoán và linh cảm của mình", "J", "P", "JP"),
            ("Tại các buổi gặp mặt, bạn sẽ:", "Muốn tận hưởng bữa tiệc và ở lại đến cuối cùng", "Nhanh chóng thấy mệt mỏi và muốn ra về sớm", "E", "I", "EI"),
            ("Tuýp người nào sẽ thu hút bạn hơn?", "Người logic và thực tế", "Người có khả năng tưởng tượng phong phú", "S", "N", "SN"),
            ("Bạn hứng thú hơn với những sự việc:", "Đã và đang xảy ra", "Có khả năng xảy ra", "S", "N", "SN"),
            ("Bạn thường đánh giá người khác dựa trên:", "Quy định, nguyên tắc", "Hoàn cảnh cụ thể", "T", "F", "TF"),
            ("Khi tiếp cận người khác, bạn thường đánh giá họ dựa trên góc nhìn nào?", "Khách quan", "Chủ quan", "T", "F", "TF"),
            ("Bạn thường là người:", "Luôn đúng giờ", "Thong thả, linh hoạt về thời gian", "J", "P", "JP"),
            ("Sau khi trải qua một kỳ thi, bạn thường:", "Cảm thấy nhẹ nhõm và bắt đầu lên lịch đi chơi", "Lo lắng về kết quả sẽ đạt được", "J", "P", "JP"),
            ("Trong nhóm, bạn thường là người:", "Luôn nắm bắt thông tin kịp thời", "Biết thông tin muộn hơn", "E", "I", "EI"),
            ("Cách bạn giải quyết những công việc thường ngày là:", "Làm theo cách thông thường", "Làm theo cách của riêng mình", "S", "N", "SN"),
            ("Theo bạn, các nhà văn nên:", "Viết chính xác những gì họ nghĩ, diễn đạt một cách rõ ràng, nghĩa trên mặt chữ", "Diễn đạt bằng biện pháp so sánh, liên tưởng, ví von thâm sâu", "S", "N", "SN"),
            ("Điều gì thu hút bạn hơn?", "Tính nhất quán trong tư tưởng", "Mối quan hệ hài hòa giữa người với người", "T", "F", "TF"),
            ("Bạn cảm thấy thoải mái hơn khi đưa ra nhận xét:", "Dựa trên logic", "Dựa trên quan điểm, giá trị cá nhân", "T", "F", "TF"),
            ("Bạn thích những điều:", "Theo kế hoạch và ổn định", "Linh hoạt và có thể thay đổi", "J", "P", "JP"),
            ("Một phút thật lòng với bản thân nhé. Bạn là người:", "Nghiêm túc, quyết đoán", "Dễ tính, thoải mái", "J", "P", "JP"),
            ("Khi nói chuyện điện thoại, bạn:", "Hiếm khi băn khoăn đến những điều mình sẽ nói", "Thường chuẩn bị trước những điều mình sẽ nói", "E", "I", "EI"),
            ("Theo bạn, các sự việc và hiện tượng:", "Tự nói lên bản chất của chính nó", "Tồn tại để minh họa cho các quy luật, quy tắc khác", "S", "N", "SN"),
            ("Những người có tầm nhìn xa:", "Ở mức độ nào đó, họ thường gây khó chịu cho người khác", "Khá thú vị, lôi cuốn", "S", "N", "SN"),
            ("Bạn là người:", "Có cái đầu lạnh", "Có trái tim ấm", "T", "F", "TF"),
            ("Bạn cảm thấy tồi tệ hơn khi đối mặt với:", "Sự bất công", "Sự tàn nhẫn", "T", "F", "TF"),
            ("Theo bạn, quyết định nên được đưa ra:", "Dựa trên việc cân nhắc và lựa chọn kỹ lưỡng", "Thuận theo tự nhiên, nước chảy mây trôi", "J", "P", "JP"),
            ("Khi đi mua sắm, bạn thích cảm giác nào hơn?", "Đã mua được thứ mình muốn", "Đang trong quá trình lựa chọn", "J", "P", "JP"),
            ("Trong công ty, bạn là người:", "Khởi xướng các câu chuyện", "Đợi người khác khởi xướng rồi tham gia vào", "E", "I", "EI"),
            ("Với những kiến thức, quy luật đã được xã hội công nhận, bạn sẽ:", "Tin tưởng không nghi ngờ", "Không ngừng đặt nghi vấn về tính chính xác", "S", "N", "SN"),
            ("Theo bạn, trẻ em thường không:", "Tự mình phát huy hết năng lực", "Khai thác tối đa trí tưởng tượng của mình", "S", "N", "SN"),
            ("Khi mua xe hơi, bạn nghĩ yếu tố nào quan trọng hơn?", "Nhu cầu sử dụng", "Sở thích cá nhân", "T", "F", "TF"),
            ("Tính cách của bạn nghiêng về:", "Cứng rắn", "Mềm mỏng", "T", "F", "TF"),
            ("Khả năng nào đáng khâm phục hơn?", "Tổ chức và làm việc bài bản, có phương pháp, hệ thống", "Dễ dàng thích ứng và linh hoạt trong mọi tình huống", "J", "P", "JP"),
            ("Bạn mong muốn điều gì hơn ở cấp trên?", "Chuyên môn xuất sắc", "Tư duy cởi mở", "J", "P", "JP"),
            ("Khi đối mặt với những vấn đề mới, bạn thường cảm thấy:", "Hào hứng, tràn đầy năng lượng", "Mệt mỏi, nhanh chóng bị hút cạn sức lực", "E", "I", "EI"),
            ("Tính cách của bạn thiên về:", "Thực tế", "Mơ mộng", "S", "N", "SN"),
            ("Bạn sẽ quan tâm hơn đến:", "Giá trị thực tế mà một người mang lại", "Cảm nhận, suy nghĩ của đối phương", "T", "F", "TF"),
            ("Điều gì làm bạn thoải mái hơn?", "Thảo luận kỹ lưỡng về một vấn đề (quá trình)", "Thống nhất được hướng giải quyết cho một vấn đề (kết quả)", "J", "P", "JP"),
            ("Bạn sẽ lựa chọn công việc nào?", "Công việc bạn không thực sự thích nhưng đem lại thu nhập cao", "Công việc mà bạn hằng mơ ước nhưng thu nhập trung bình", "T", "F", "TF"),
            ("Bạn thích được điều hướng công việc theo cách:", "Giao việc trọn gói, bàn giao 100% sau khi hoàn thành", "Giao việc hàng ngày, từng bước hoàn thành công việc", "J", "P", "JP"),
            ("Bạn thường tìm kiếm những điều:", "Được sắp xếp theo thứ tự rõ ràng", "Ngẫu nhiên, tùy hứng", "J", "P", "JP"),
            ("Bạn thường kết giao:", "Với nhiều bạn nhưng không quá thân", "Với ít bạn nhưng tình cảm khăng khít", "E", "I", "EI"),
            ("Điều gì ảnh hưởng tới quyết định của bạn nhiều hơn?", "Tình hình thực tế", "Nguyên tắc, luật lệ", "S", "N", "SN"),
            ("Bạn thấy hứng thú hơn với việc:", "Sản xuất và phân phối", "Thiết kế và nghiên cứu", "S", "N", "SN"),
            ("Bạn thường được tán thưởng vì:", "Là người có tư duy logic", "Là người tinh tế, tình cảm", "T", "F", "TF"),
            ("Bạn thấy điều gì giá trị hơn ở bản thân mình?", "Tinh thần kiên định, vững vàng", "Sự toàn tâm, cống hiến", "T", "F", "TF"),
            ("Bạn đánh giá cao:", "Tuyên bố cuối cùng, không thay đổi", "Tuyên bố mang tính dự kiến, có thể thay đổi", "J", "P", "JP"),
            ("Bạn thấy nhẹ nhõm hơn:", "Trước khi đưa ra quyết định", "Sau khi đưa ra quyết định", "J", "P", "JP"),
            ("Bạn đánh giá bản thân là người như thế nào?", "Tôi có thể dễ dàng bắt chuyện với người lạ", "Tôi không có hứng thú trò chuyện với người lạ", "E", "I", "EI"),
            ("Bạn có xu hướng tin tưởng vào:", "Kinh nghiệm của mình", "Linh cảm của mình", "S", "N", "SN"),
            ("Bạn thường:", "Giải quyết vấn đề một cách thực tế và hiệu quả (có thể áp dụng được ngay)", "Nghĩ ra những giải pháp sáng tạo và độc đáo (có thể không thực hiện ngay được)", "S", "N", "SN"),
            ("Bạn thấy ấn tượng hơn khi tiếp xúc với một người:", "Giàu lý trí", "Giàu cảm xúc", "T", "F", "TF"),
            ("Bạn đánh giá tính cách nào cao hơn?", "Sự công bằng", "Sự đồng cảm", "T", "F", "TF"),
            ("Theo bạn, mọi chuyện sẽ diễn ra hợp lý hơn nếu:", "Được chuẩn bị trước", "Diễn ra tự nhiên", "J", "P", "JP"),
            ("Trong một mối quan hệ:", "Điều gì cũng có thể thương lượng và điều chỉnh lại để đạt được sự đồng thuận chung", "Nên để mọi chuyện diễn ra tự nhiên, thuận theo hoàn cảnh đưa đẩy", "J", "P", "JP"),
            ("Khi có số lạ gọi tới điện thoại của bạn, bạn sẽ:", "Nhấc máy ngay để xem ai đang gọi", "Chần chừ không nghe máy", "E", "I", "EI"),
            ("Bạn đánh giá cao khả năng của mình hơn khi:", "Đưa ra quyết định dựa trên số liệu thực tế", "Đưa ra quyết định dựa trên trực giác và linh cảm", "S", "N", "SN"),
            ("Bạn bị thu hút hơn với điều gì?", "Những nguyên tắc cơ bản", "Những ẩn ý sâu xa", "S", "N", "SN"),
            ("Bạn không thích những người:", "Quá cảm xúc (dễ bị tình cảm chi phối)", "Quá lý trí (không dễ bị ảnh hưởng bởi yếu tố cảm xúc)", "T", "F", "TF"),
            ("Bạn thuộc tuýp người:", "Mạnh mẽ, quyết đoán, không dễ bị thuyết phục", "Mềm mỏng, dễ bị thuyết phục, dễ thay đổi quan điểm dưới ảnh hưởng của người khác", "T", "F", "TF"),
            ("Trước một chuyến đi chơi, bạn thường:", "Lên lịch trình chi tiết, rõ ràng", "Tới đâu hay tới đó", "J", "P", "JP"),
            ("Trong công việc, bạn thường:", "Làm việc theo thói quen", "Hay thay đổi, thích thử nghiệm những điều mới", "J", "P", "JP"),
            ("Bạn nghĩ mình là người:", "Cởi mở, dễ gần", "Kín tiếng, khó đoán", "E", "I", "EI"),
            ("Khi viết lách, bạn có xu hướng:", "Viết về những điều thực tế (thiên về nghĩa đen)", "Viết những áng văn bay bổng (thiên về nghĩa bóng)", "S", "N", "SN"),
            ("Là một cấp trên, bạn cảm thấy điều gì khó hơn?", "Bỏ qua yếu tố cảm xúc, công việc là quan trọng nhất", "Hiểu và chia sẻ với cấp dưới", "T", "F", "TF"),
            ("Bạn cảm thấy mình cần trở nên:", "Lý trí hơn", "Tình cảm hơn", "T", "F", "TF"),
            ("Điều gì khiến bạn khó chấp nhận hơn?", "Hành động thiếu suy nghĩ, gây ra sai phạm lớn", "Sự chỉ trích, phê phán nghiêm khắc quá mức", "T", "F", "TF"),
            ("Bạn sẽ lựa chọn:", "Sự kiện đã được lên kế hoạch trước", "Sự kiện chưa được lên kế hoạch trước", "J", "P", "JP"),
            ("Phong cách làm việc của bạn là gì?", "Cân nhắc thận trọng", "Tự nhiên, tự phát", "J", "P", "JP")
        ]

        for i, (text, opt_a, opt_b, a_val, b_val, dim) in enumerate(questions_raw):
            existing_q = await db.execute(select(MBTIQuestion).where(MBTIQuestion.order == i + 1))
            q_obj = existing_q.scalars().first()
            if not q_obj:
                db.add(MBTIQuestion(
                    order=i + 1,
                    text=text,
                    option_a_text=opt_a,
                    option_b_text=opt_b,
                    option_a_value=a_val,
                    option_b_value=b_val,
                    dimension=dim
                ))
            else:
                # Update existing question to include option text
                q_obj.text = text
                q_obj.option_a_text = opt_a
                q_obj.option_b_text = opt_b
                q_obj.option_a_value = a_val
                q_obj.option_b_value = b_val
                q_obj.dimension = dim
        
        await db.commit()
        print("MBTI Seeding completed!")

if __name__ == "__main__":
    asyncio.run(seed_mbti())

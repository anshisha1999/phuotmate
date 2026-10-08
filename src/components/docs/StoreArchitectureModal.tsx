import React, { useState } from 'react';
import { 
  Database, GitBranch, FolderTree, Smartphone, ShieldCheck, 
  Layers, Code2, Copy, Check, Terminal, Cpu, FileText, CheckCircle2 
} from 'lucide-react';

export const StoreArchitectureView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'erd' | 'screenflow' | 'structure' | 'store_export'>('erd');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sqlSchemaCode = `-- ========================================================
-- PHƯỢTMATE POSTGRESQL / SUPABASE REALTIME SCHEMA (PRODUCTION)
-- ========================================================

-- 1. BẢNG USERS (HỒ SƠ BIKER)
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    avatar_url TEXT,
    phone_number VARCHAR(15),
    vehicle_model TEXT, -- vd: "Winner X 150", "CRF 250L"
    bank_code VARCHAR(10) NOT NULL DEFAULT 'MB', -- BIN Napas: MB, VCB, TCB...
    bank_account_number VARCHAR(30) NOT NULL,
    bank_account_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BẢNG TRIPS (CHUYẾN ĐI)
CREATE TABLE public.trips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invite_code VARCHAR(6) UNIQUE NOT NULL, -- vd: 'HG8824', 'TX6991'
    title TEXT NOT NULL,
    departure TEXT NOT NULL, -- vd: "Hà Nội"
    destination TEXT NOT NULL, -- vd: "Mã Pí Lèng, Hà Giang"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cover_image TEXT,
    default_vehicle TEXT DEFAULT 'Côn tay',
    vibe TEXT,
    created_by UUID REFERENCES public.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BẢNG TRIP_MEMBERS (THÀNH VIÊN ĐOÀN)
CREATE TABLE public.trip_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL DEFAULT 'Rider', -- 'Lead', 'Sweep', 'Treasurer', 'Rider'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(trip_id, user_id)
);

-- 4. BẢNG ITINERARY_DAYS (NGÀY TRONG LỊCH TRÌNH)
CREATE TABLE public.itinerary_days (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    day_number INT NOT NULL, -- 1, 2, 3...
    date_label TEXT, -- vd: "Ngày 1: 15/10"
    route_title TEXT NOT NULL,
    total_km INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BẢNG ITINERARY_CARDS (CÁC CHẶNG DẠNG THẺ)
CREATE TABLE public.itinerary_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day_id UUID REFERENCES public.itinerary_days(id) ON DELETE CASCADE,
    sort_order INT NOT NULL DEFAULT 0, -- Kéo thả sắp xếp thứ tự
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    route_note TEXT, -- Tuyến đường QL4C, ĐT128...
    gas_station_alert TEXT, -- Ghi chú trạm xăng tiếp tế
    safety_warning TEXT, -- Cảnh báo đèo dốc hiểm trở, sương mù, góc cua mù
    category VARCHAR(20) NOT NULL, -- 'departure','ride','sight','food','fuel','camp'
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BẢNG EXPENSES (SỔ QUỸ CHI TIÊU)
CREATE TABLE public.expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    trip_id UUID REFERENCES public.trips(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount NUMERIC(15, 2) NOT NULL, -- VNĐ
    category VARCHAR(30) NOT NULL, -- 'Xăng cộ', 'Ăn uống', 'Chỗ ở', 'Vé', 'Sửa xe'
    paid_by UUID REFERENCES public.users(id) ON DELETE RESTRICT,
    expense_date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. BẢNG EXPENSE_SPLITS (DANH SÁCH NGƯỜI CÙNG CHIA)
CREATE TABLE public.expense_splits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    expense_id UUID REFERENCES public.expenses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    share_amount NUMERIC(15, 2) NOT NULL,
    is_settled BOOLEAN DEFAULT FALSE,
    UNIQUE(expense_id, user_id)
);

-- Bật tính năng Realtime cho bảng trips, itinerary_cards, expenses
ALTER PUBLICATION supabase_realtime ADD TABLE public.trips;
ALTER PUBLICATION supabase_realtime ADD TABLE public.itinerary_cards;
ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;`;

  const screenFlowText = `========================================================================
LUỒNG ĐI MÀN HÌNH (MOBILE SCREEN FLOW - HIG & MATERIAL 3 COMPLIANT)
========================================================================

 [Màn hình Khởi động (Splash)]
              |
              v
 [Đăng Nhập 1-Chạm (Auth)]
  ├── Google Sign-In (Firebase/Supabase OAuth)
  ├── Apple ID (Sign in with Apple - HIG bắt buộc cho iOS)
  └── Đăng nhập Email/Mật khẩu hoặc Biker Profile Demo
              |
              v
 [Trang Chủ / Chọn Chuyến Đi (Trip Home)]
  ├── Tạo Chuyến Đi Mới (+ Tour Name, Xe máy, Ngày đi, Điểm đến)
  └── Nhập Mã Mời (6 Ký tự) hoặc Quét Mã QR để vào đoàn
              |
              v
 ┌────────────────────────────────────────────────────────┐
 │            BỘ 5 TAB ĐIỀU HƯỚNG CHÍNH (BOTTOM NAV)      │
 └────────────────────────────────────────────────────────┘
       │            │              │             │              │
       v            v              v             v              v
[1. Hành trình] [2. Lịch trình] [3. Reels AI] [4. Sổ quỹ]  [5. Store Spec]
       │            │              │             │              │
       │            ├── Card List  ├── Chọn 3-5  ├── Bảng kê    └── ERD & Code
       │            │   (CRUD &    │   ảnh chụp  │   chi tiêu       Kiến trúc
       │            │   Reorder)   ├── Phân tích │   thời gian      (Flutter /
       │            └── AI Lên     │   Multimodal│   thực           React Native)
       │                lịch trình │   Gemini    ├── Thuật toán
       │                (Gemini)   ├── Bài review│   Debt Simpli-
       │                           │   Facebook  │   fication
       │                           └── Kịch bản  └── Dynamic
       │                               Reels 30s     VietQR
       │                                             Modal
       └── Mời bạn (Invite QR Modal) ────────────────┘`;

  const flutterStructure = `phuotmate_mobile/
├── android/
│   ├── app/
│   │   ├── build.gradle              <-- Thiết lập bundleId, signingConfig release (.aab)
│   │   └── src/main/AndroidManifest.xml <-- Quyền Camera, Location, Network
├── ios/
│   ├── Runner/
│   │   ├── Info.plist                <-- NSCameraUsageDescription, NSPhotoLibraryUsage
│   │   └── Podfile
├── lib/
│   ├── main.dart                     <-- Khởi tạo Supabase/Firebase & Riverpod
│   ├── core/
│   │   ├── theme/app_theme.dart      <-- Material 3 & Apple HIG tokens
│   │   ├── network/api_client.dart   <-- Gọi proxy Cloud Function / Server API
│   │   └── utils/debt_simplifier.dart<-- Thuật toán Splitwise O(N log N)
│   ├── models/
│   │   ├── trip_model.dart
│   │   ├── itinerary_card_model.dart
│   │   └── expense_model.dart
│   └── modules/
│       ├── auth/views/login_view.dart
│       ├── trip/views/trip_home_view.dart
│       ├── itinerary/
│       │   ├── views/itinerary_card_view.dart
│       │   └── widgets/ai_planner_bottom_sheet.dart
│       ├── storyteller/views/ai_reels_view.dart
│       └── expense/
│           ├── views/expense_ledger_view.dart
│           └── widgets/vietqr_dialog.dart
└── pubspec.yaml                      <-- Dependencies (supabase_flutter, qr_flutter, dio)`;

  const fastlaneConfig = `# Fastlane Match & App Store / Google Play Deploy Pipeline
default_platform(:android)

platform :android do
  desc "Build and deploy production Android App Bundle to Google Play Internal/Production"
  lane :deploy_play_store do
    gradle(task: "bundleRelease")
    upload_to_play_store(
      track: 'internal',
      aab: 'build/app/outputs/bundle/release/app-release.aab',
      skip_upload_metadata: false,
      skip_upload_images: true
    )
  end
end

platform :ios do
  desc "Build and submit iOS IPA to Apple TestFlight / App Store"
  lane :deploy_app_store do
    match(type: "appstore", readonly: true)
    build_app(workspace: "Runner.xcworkspace", scheme: "Runner")
    upload_to_testflight(skip_waiting_for_build_processing: true)
  end
end`;

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-4 rounded-3xl bg-gradient-to-r from-blue-500/15 via-indigo-500/10 to-slate-900 border border-blue-500/30 flex items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Hồ Sơ Kỹ Thuật Đóng Gói Lên Store
              </h2>
              <span className="px-1.5 py-0.2 text-[9px] bg-blue-500 text-white font-black rounded uppercase">
                App Store & Google Play
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Tài liệu kiến trúc hệ thống, Database Schema, Screen Flow & Mobile Pipeline
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-4 p-1 bg-slate-950 rounded-2xl border border-slate-800 text-xs">
        <button
          onClick={() => setActiveTab('erd')}
          className={`py-2 px-1 font-bold rounded-xl transition text-center ${
            activeTab === 'erd'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          1. Schema ERD
        </button>
        <button
          onClick={() => setActiveTab('screenflow')}
          className={`py-2 px-1 font-bold rounded-xl transition text-center ${
            activeTab === 'screenflow'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          2. Screen Flow
        </button>
        <button
          onClick={() => setActiveTab('structure')}
          className={`py-2 px-1 font-bold rounded-xl transition text-center ${
            activeTab === 'structure'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          3. Thư Mục Dự Án
        </button>
        <button
          onClick={() => setActiveTab('store_export')}
          className={`py-2 px-1 font-bold rounded-xl transition text-center ${
            activeTab === 'store_export'
              ? 'bg-blue-600 text-white shadow'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          4. Build .AAB & .IPA
        </button>
      </div>

      {/* TAB 1: ERD & DB SCHEMA */}
      {activeTab === 'erd' && (
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Sơ Đồ Thực Thể Cơ Sở Dữ Liệu (PostgreSQL / Supabase Realtime)
              </h3>
            </div>
            <button
              onClick={() => copySnippet('sql', sqlSchemaCode)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copiedCode === 'sql' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'sql' ? 'Đã sao chép' : 'Sao chép SQL'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 leading-relaxed">
            Hệ thống gồm 7 bảng cốt lõi thiết kế chuẩn hóa 3NF, hỗ trợ Supabase Realtime Change Listener để toàn bộ thành viên trong đoàn cập nhật lịch trình và tiền quỹ tức thời.
          </div>

          <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-blue-300 overflow-x-auto leading-relaxed max-h-96">
            <code>{sqlSchemaCode}</code>
          </pre>
        </div>
      )}

      {/* TAB 2: SCREEN FLOW */}
      {activeTab === 'screenflow' && (
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Sơ Đồ Chuyển Tiếp Màn Hình (Screen Flow Architecture)
              </h3>
            </div>
            <button
              onClick={() => copySnippet('flow', screenFlowText)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copiedCode === 'flow' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'flow' ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 leading-relaxed text-slate-300">
              <strong className="text-white">Tuân thủ Apple HIG & Material 3:</strong>
              <ul className="list-disc list-inside mt-1 space-y-1 text-slate-400">
                <li>Bắt buộc cung cấp Sign in with Apple nếu có Google Sign-in để qua vòng kiểm duyệt App Store Review.</li>
                <li>Safe Area Insets bảo vệ màn hình tai thỏ (Dynamic Island, Home Indicator).</li>
                <li>Modal dạng Bottom Sheet tiện lợi cho thao tác bằng 1 ngón cái khi đang dừng xe.</li>
                <li>Tự động lưu Offline-first để các phượt thủ vẫn xem được lịch trình khi vào vùng mất sóng điện thoại.</li>
              </ul>
            </div>

            <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-emerald-300 overflow-x-auto leading-relaxed">
              <code>{screenFlowText}</code>
            </pre>
          </div>
        </div>
      )}

      {/* TAB 3: PROJECT STRUCTURE */}
      {activeTab === 'structure' && (
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-amber-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Cấu Trúc Thư Mục Chuẩn Mobile (Flutter / React Native)
              </h3>
            </div>
            <button
              onClick={() => copySnippet('structure', flutterStructure)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copiedCode === 'structure' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'structure' ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Cấu trúc Feature-First kết hợp Clean Architecture, tách biệt rõ ràng giữa Presentation Layer, Domain Layer và Network Layer.
          </p>

          <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-amber-300 overflow-x-auto leading-relaxed">
            <code>{flutterStructure}</code>
          </pre>
        </div>
      )}

      {/* TAB 4: STORE PACKAGING & FASTLANE */}
      {activeTab === 'store_export' && (
        <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-purple-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Pipeline Xuất File Build .AAB & .IPA (Fastlane CI/CD)
              </h3>
            </div>
            <button
              onClick={() => copySnippet('fastlane', fastlaneConfig)}
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg border border-slate-700 transition"
            >
              {copiedCode === 'fastlane' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode === 'fastlane' ? 'Đã sao chép' : 'Sao chép'}</span>
            </button>
          </div>

          <div className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-emerald-400 text-[11px]">Google Play Store (Android)</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  • Target SDK 34 (Android 14+)<br/>
                  • Định dạng xuất: <code className="text-white">.aab</code> (App Bundle)<br/>
                  • Keystore signing: V2 / V3 Scheme
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <div className="font-bold text-blue-400 text-[11px]">Apple App Store (iOS)</div>
                <div className="text-[10px] text-slate-400 mt-1">
                  • Quyền camera: NSCameraUsageDescription<br/>
                  • Định dạng xuất: <code className="text-white">.ipa</code><br/>
                  • Fastlane Match & App Store Connect API
                </div>
              </div>
            </div>

            <pre className="p-3 bg-slate-950 rounded-2xl border border-slate-800 font-mono text-[11px] text-purple-300 overflow-x-auto leading-relaxed">
              <code>{fastlaneConfig}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};

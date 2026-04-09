-- ========================================
-- LeadFlow - Supabase DBスキーマ
-- Supabaseダッシュボード > SQL Editor で実行してください
-- ========================================

-- 1. プロフィールテーブル（認証ユーザーに紐づく）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 新規ユーザー作成時にプロフィールを自動作成するトリガー
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. 企業テーブル
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT DEFAULT '',
  employee_count TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  website TEXT DEFAULT '',
  address TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. リードテーブル
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_title TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  contact_phone TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacting', 'contacted', 'appointment', 'nurturing', 'lost')),
  source TEXT DEFAULT '',
  assignee TEXT DEFAULT '',
  next_action TEXT DEFAULT '',
  next_action_date DATE,
  appointment_date DATE,
  note TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. 対応履歴テーブル
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'other')),
  content TEXT NOT NULL,
  result TEXT DEFAULT '',
  created_by UUID REFERENCES profiles(id),
  created_by_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. updated_at を自動更新するトリガー
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 6. ドキュメントテーブル（資料トラッキング）
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('pdf', 'url')),
  file_path TEXT DEFAULT '',
  external_url TEXT DEFAULT '',
  tracking_id TEXT NOT NULL UNIQUE,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. ドキュメント閲覧履歴テーブル
CREATE TABLE document_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER DEFAULT 0,
  ip_address TEXT DEFAULT '',
  user_agent TEXT DEFAULT ''
);

-- 8. LP登録者テーブル
CREATE TABLE signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. インデックス
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_next_action_date ON leads(next_action_date);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_activities_lead_id ON activities(lead_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);
CREATE INDEX idx_documents_lead_id ON documents(lead_id);
CREATE INDEX idx_documents_tracking_id ON documents(tracking_id);
CREATE INDEX idx_document_views_document_id ON document_views(document_id);
CREATE INDEX idx_document_views_viewed_at ON document_views(viewed_at);

-- 10. Row Level Security（RLS）
-- ユーザーごとにデータを分離（created_by = 自分のみ）
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE signups ENABLE ROW LEVEL SECURITY;

-- プロフィール: 自分のプロフィールのみ
CREATE POLICY "own_profile" ON profiles FOR ALL TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- 企業: 自分が作成したもののみ
CREATE POLICY "own_companies" ON companies FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- リード: 自分が作成したもののみ
CREATE POLICY "own_leads" ON leads FOR ALL TO authenticated
  USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());

-- アクティビティ: 自分のリードに紐づくもの
CREATE POLICY "own_activities" ON activities FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE created_by = auth.uid()))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE created_by = auth.uid()));

-- ドキュメント: 自分のリードに紐づくもの（認証ユーザー）
CREATE POLICY "own_documents" ON documents FOR ALL TO authenticated
  USING (lead_id IN (SELECT id FROM leads WHERE created_by = auth.uid()))
  WITH CHECK (lead_id IN (SELECT id FROM leads WHERE created_by = auth.uid()));

-- ドキュメント: 匿名ユーザーはtracking_idで閲覧可能（ビューワーページ用）
CREATE POLICY "anon_read_documents" ON documents FOR SELECT TO anon USING (true);

-- 閲覧履歴: 認証ユーザーは自分のドキュメントの閲覧履歴を見れる
CREATE POLICY "own_document_views" ON document_views FOR ALL TO authenticated
  USING (document_id IN (SELECT id FROM documents WHERE lead_id IN (SELECT id FROM leads WHERE created_by = auth.uid())))
  WITH CHECK (document_id IN (SELECT id FROM documents WHERE lead_id IN (SELECT id FROM leads WHERE created_by = auth.uid())));

-- 閲覧履歴: 匿名ユーザーはINSERTのみ（トラッキング記録用）
CREATE POLICY "anon_insert_views" ON document_views FOR INSERT TO anon WITH CHECK (true);

-- LP登録: 匿名ユーザーがINSERT可能（LP申し込みフォーム用）
CREATE POLICY "anon_insert_signups" ON signups FOR INSERT TO anon WITH CHECK (true);
-- LP登録: 管理者は全件閲覧可能
CREATE POLICY "authenticated_read_signups" ON signups FOR SELECT TO authenticated USING (true);

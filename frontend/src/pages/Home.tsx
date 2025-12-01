import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, FileText, FileEdit } from 'lucide-react';
import { Button, Input, Textarea, Card, useToast } from '@/components/shared';
import { useProjectStore } from '@/store/useProjectStore';

type CreationType = 'idea' | 'outline' | 'description';

const templates = [
  { id: '1', name: '简约商务', preview: '' },
  { id: '2', name: '活力色彩', preview: '' },
  { id: '3', name: '科技蓝', preview: '' },
];

const SAVED_TEMPLATE_PREVIEW_KEY = 'home_saved_template_preview';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { initializeProject, isGlobalLoading } = useProjectStore();
  const { show, ToastContainer } = useToast();
  
  const [activeTab, setActiveTab] = useState<CreationType>('idea');
  const [content, setContent] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<File | null>(null);
  const [templatePreview, setTemplatePreview] = useState<string>('');

  // 从 localStorage 恢复保存的模板预览
  useEffect(() => {
    const savedPreview = localStorage.getItem(SAVED_TEMPLATE_PREVIEW_KEY);
    if (savedPreview) {
      setTemplatePreview(savedPreview);
    }
  }, []);

  const tabConfig = {
    idea: {
      icon: <Sparkles size={20} />,
      label: '一句话生成',
      placeholder: '例如：生成一份关于 AI 发展史的演讲 PPT',
      description: '输入你的想法，AI 将为你生成完整的 PPT',
    },
    outline: {
      icon: <FileText size={20} />,
      label: '从大纲生成',
      placeholder: '粘贴你的 PPT 大纲...\n\n例如：\n第一部分：AI 的起源\n- 1950 年代的开端\n- 达特茅斯会议\n\n第二部分：发展历程\n...',
      description: '已有大纲？直接粘贴即可快速生成',
    },
    description: {
      icon: <FileEdit size={20} />,
      label: '从描述生成',
      placeholder: '粘贴你的详细页面描述...\n\n例如：\n第 1 页\n标题：人工智能的诞生\n内容：1950 年，图灵提出"图灵测试"...\n...',
      description: '已有完整描述？直接生成图片',
    },
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedTemplate(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;
        setTemplatePreview(preview);
        // 保存模板预览到 localStorage
        if (preview) {
          localStorage.setItem(SAVED_TEMPLATE_PREVIEW_KEY, preview);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      show({ message: '请输入内容', type: 'error' });
      return;
    }

    try {
      await initializeProject(activeTab, content, selectedTemplate || undefined);
      
      // 根据类型跳转到不同页面
      const projectId = localStorage.getItem('currentProjectId');
      if (!projectId) {
        show({ message: '项目创建失败', type: 'error' });
        return;
      }
      
      if (activeTab === 'idea' || activeTab === 'outline') {
        navigate(`/project/${projectId}/outline`);
      } else {
        navigate(`/project/${projectId}/detail`);
      }
    } catch (error: any) {
      console.error('创建项目失败:', error);
      // 错误已经在 store 中处理并显示
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-banana-50 via-white to-gray-50">
      {/* 导航栏 */}
      <nav className="h-16 bg-white shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-banana-500 to-banana-600 rounded-lg flex items-center justify-center text-2xl">
              🍌
            </div>
            <span className="text-xl font-bold text-gray-900">蕉幻</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
              历史项目
            </Button>
            <Button variant="ghost" size="sm">帮助</Button>
          </div>
        </div>
      </nav>

      {/* 主内容 */}
      <main className="max-w-4xl mx-auto px-4 py-16">
        {/* 标题区 */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            🍌 蕉幻 Banana Slides
          </h1>
          <p className="text-xl text-gray-600">
            AI 原生 PPT 生成器，一句话创造精彩
          </p>
        </div>

        {/* 创建卡片 */}
        <Card className="p-10">
          {/* 选项卡 */}
          <div className="flex gap-4 mb-8">
            {(Object.keys(tabConfig) as CreationType[]).map((type) => {
              const config = tabConfig[type];
              return (
                <button
                  key={type}
                  onClick={() => setActiveTab(type)}
                  className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                    activeTab === type
                      ? 'bg-gradient-to-r from-banana-500 to-banana-600 text-black shadow-yellow'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-banana-50'
                  }`}
                >
                  {config.icon}
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* 描述 */}
          <p className="text-gray-600 mb-6">
            {tabConfig[activeTab].description}
          </p>

          {/* 输入区 */}
          {activeTab === 'idea' ? (
            <Input
              placeholder={tabConfig[activeTab].placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="mb-6"
            />
          ) : (
            <Textarea
              placeholder={tabConfig[activeTab].placeholder}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="mb-6"
            />
          )}

          {/* 模板选择 */}
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              🎨 选择风格模板 (可选)
            </h3>
            <div className="grid grid-cols-4 gap-4">
              {/* 预设模板 */}
              {templates.map((template) => (
                <div
                  key={template.id}
                  className="aspect-[4/3] rounded-lg border-2 border-gray-200 hover:border-banana-500 cursor-pointer transition-all bg-gray-100 flex items-center justify-center"
                >
                  <span className="text-sm text-gray-500">{template.name}</span>
                </div>
              ))}

              {/* 上传自定义 */}
              <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-gray-300 hover:border-banana-500 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 relative overflow-hidden">
                {templatePreview ? (
                  <img
                    src={templatePreview}
                    alt="Template preview"
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <>
                    <span className="text-2xl">+</span>
                    <span className="text-sm text-gray-500">上传模板</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleTemplateUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* 提交按钮 */}
          <div className="flex justify-center">
            <Button
              size="lg"
              onClick={handleSubmit}
              loading={isGlobalLoading}
              className="w-64"
            >
              开始生成
            </Button>
          </div>
        </Card>
      </main>
      <ToastContainer />
    </div>
  );
};


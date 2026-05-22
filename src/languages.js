import { SiPython, SiJavascript, SiReact, SiVuedotjs, SiNestjs } from 'react-icons/si'

const LANGUAGES = {
  python: { label: 'Python', icon: SiPython, color: 'text-lang-python', bg: 'bg-lang-python/10 dark:bg-lang-python/20', hover: 'hover:border-lang-python hover:shadow-lang-python/5', glow: 'bg-lang-python/[0.02] dark:bg-lang-python/[0.03]', prism: 'python', desc: '优雅精炼' },
  javascript: { label: 'JavaScript', icon: SiJavascript, color: 'text-lang-javascript', bg: 'bg-lang-javascript/10 dark:bg-lang-javascript/20', hover: 'hover:border-lang-javascript hover:shadow-lang-javascript/5', glow: 'bg-lang-javascript/[0.02] dark:bg-lang-javascript/[0.03]', prism: 'javascript', desc: '灵活强大' },
  react: { label: 'React', icon: SiReact, color: 'text-lang-react', bg: 'bg-lang-react/10 dark:bg-lang-react/20', hover: 'hover:border-lang-react hover:shadow-lang-react/5', glow: 'bg-lang-react/[0.02] dark:bg-lang-react/[0.03]', prism: 'jsx', desc: '组件驱动' },
  vue: { label: 'Vue', icon: SiVuedotjs, color: 'text-lang-vue', bg: 'bg-lang-vue/10 dark:bg-lang-vue/20', hover: 'hover:border-lang-vue hover:shadow-lang-vue/5', glow: 'bg-lang-vue/[0.02] dark:bg-lang-vue/[0.03]', prism: 'javascript', desc: '渐进灵活' },
  nestjs: { label: 'NestJS', icon: SiNestjs, color: 'text-lang-nestjs', bg: 'bg-lang-nestjs/10 dark:bg-lang-nestjs/20', hover: 'hover:border-lang-nestjs hover:shadow-lang-nestjs/5', glow: 'bg-lang-nestjs/[0.02] dark:bg-lang-nestjs/[0.03]', prism: 'typescript', desc: '企业级后端' },
}

export default LANGUAGES

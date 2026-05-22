import React, { useMemo, useState, useEffect } from 'react'
import Prism from 'prismjs'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-javascript'
import 'prismjs/components/prism-jsx'
import 'prismjs/components/prism-markup'
import 'prismjs/components/prism-typescript'
import 'prismjs/themes/prism-tomorrow.css'
import LANGUAGES from '../languages'
import { 
  ArrowLeftRight, 
  Copy, 
  Check, 
  Sparkles, 
  Compass, 
  Info, 
  AlertCircle, 
  Terminal, 
  Cpu, 
  BookOpen,
  ChevronRight,
  Bookmark
} from 'lucide-react'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

const pyJsEquivalences = [
  { 
    a: 'if', 
    b: 'if', 
    aQ: 'if', 
    bQ: 'if', 
    note: '条件判断的基石。Python 不需要圆括号，JS 需要，但在控制流概念上完全等价。',
    bridge: '最直观的心智迁移：除了括号和缩进要求不同，两者的布尔分支逻辑完全一致。',
    exampleA: 'if score >= 90:\n    print("Excellent")\nelif score >= 60:\n    print("Pass")\nelse:\n    print("Fail")',
    exampleB: 'if (score >= 90) {\n    console.log("Excellent");\n} else if (score >= 60) {\n    console.log("Pass");\n} else {\n    console.log("Fail");\n}'
  },
  { 
    a: 'elif', 
    b: 'else if', 
    aQ: 'elif', 
    bQ: 'else', 
    note: '多路条件分支。Python 将 else if 缩写为单个关键字 elif，而 JS 使用分开的 else if。',
    bridge: '在 Python 中用 `elif` 连写，而在 JS 中则是 `else` 与 `if` 配合。切忌在 JS 中写出 `elif`。',
    exampleA: 'if score >= 90:\n    print("A")\nelif score >= 80:\n    print("B")\nelse:\n    print("C")',
    exampleB: 'if (score >= 90) {\n    console.log("A");\n} else if (score >= 80) {\n    console.log("B");\n} else {\n    console.log("C");\n}'
  },
  { 
    a: 'for', 
    b: 'for', 
    aQ: 'for', 
    bQ: 'for', 
    note: '循环迭代。Python for 用于直接遍历迭代器（如列表、字典），JS for 支持经典索引、for...of 及 for...in。',
    bridge: 'Python 的 `for x in list` 相当于 JS 的 `for (const x of list)`。JS 还有底层的经典三段式索引循环。',
    exampleA: '# 遍历列表\nfor item in [1, 2, 3]:\n    print(item)\n\n# 范围循环\nfor i in range(5):\n    print(i)',
    exampleB: '// JS for...of 遍历数组\nfor (const item of [1, 2, 3]) {\n    console.log(item);\n}\n\n// JS 经典三段式索引\nfor (let i = 0; i < 5; i++) {\n    console.log(i);\n}'
  },
  { 
    a: 'def', 
    b: 'function', 
    aQ: 'def', 
    bQ: 'function', 
    note: '函数声明。Python 用关键字 def 定义函数，JS 用 function 关键字，或更常用的 ES6 箭头函数 =>。',
    bridge: '从 `def my_func(x):` 迁移到 `function myFunc(x) {}`，并注意 JS 惯用小驼峰命名，而 Python 惯用下划线命名（Snake Case）。',
    exampleA: 'def calculate_sum(a, b):\n    """计算两数之和"""\n    return a + b',
    exampleB: 'function calculateSum(a, b) {\n    // 计算两数之和\n    return a + b;\n}\n\n// 或者使用 ES6 箭头函数\nconst calculateSumArrow = (a, b) => a + b;'
  },
  { 
    a: 'lambda', 
    b: '=>', 
    aQ: 'lambda', 
    bQ: 'arrow', 
    note: '匿名函数/闭包。Python lambda 限制为单个表达式且隐式返回，JS 箭头函数支持多行且语法更简单。',
    bridge: 'Python 匿名函数语法较重 `lambda x: x * 2`，JS 箭头函数极其高频 `x => x * 2`，且在 JS 各种数组操作中无处不在。',
    exampleA: 'double = lambda x: x * 2\nprint(double(5))  # 输出 10\n\n# 数组排序应用\npairs = [(1, "one"), (2, "two")]\npairs.sort(key=lambda pair: pair[1])',
    exampleB: 'const double = x => x * 2;\nconsole.log(double(5)); // 输出 10\n\n// 数组排序应用\nconst pairs = [[1, "one"], [2, "two"]];\npairs.sort((a, b) => a[1].localeCompare(b[1]));'
  },
  { 
    a: 'self', 
    b: 'this', 
    aQ: 'self', 
    bQ: 'this', 
    note: '类实例上下文引用。Python 需要将 self 显式作为类方法的第一个参数传入，JS this 隐式绑定且受调用环境影响。',
    bridge: 'Python 显式传递 `self` 确保了作用域直观；JS 的 `this` 极其灵活多变，其值在运行时根据函数的调用方式动态绑定，极易踩坑（常需使用箭头函数或 `.bind()` 锁定上下文）。',
    exampleA: 'class Dog:\n    def __init__(self, name):\n        self.name = name\n        \n    def bark(self):\n        return f"{self.name} barks!"\n\nmy_dog = Dog("Rex")\nprint(my_dog.bark())',
    exampleB: 'class Dog {\n    constructor(name) {\n        this.name = name;\n    }\n    \n    bark() {\n        return `${this.name} barks!`;\n    }\n}\n\nconst myDog = new Dog("Rex");\nconsole.log(myDog.bark());'
  },
  { 
    a: 'None', 
    b: 'null', 
    aQ: 'None', 
    bQ: 'null', 
    note: '空值与空指针。Python 用唯一的 None 表示“什么都没有”，JS 细分为 null（显式赋空）和 undefined（未定义/默认）。',
    bridge: '在 Python 中用 `is None` 进行精确判断。对应地在 JS 中需注意 `null` 和 `undefined` 的细微差异，建议使用 `=== null` 或可选链运算符 `?.`。',
    exampleA: 'value = None\nif value is None:\n    print("Nothing here")\n\ndef get_data():\n    # 默认返回 None\n    pass',
    exampleB: 'let value = null;\nif (value === null) {\n    console.log("Nothing here");\n}\n\nlet undef;\nconsole.log(undef); // 自动为 undefined\n\nfunction getData() {\n    // 默认返回 undefined\n}'
  },
  { 
    a: 'and', 
    b: '&&', 
    aQ: 'and', 
    bQ: null, 
    note: '逻辑与运算符。Python 使用直观的英文单词 and，JS 继承了 C 语言的短路运算符 &&。',
    bridge: '心智直接转换：`a and b` 对应 `a && b`。两者都具有短路特性，即若左边为假，则立即停止向右评估。',
    exampleA: 'is_admin = True\nis_active = True\nif is_admin and is_active:\n    print("Access granted")',
    exampleB: 'const isAdmin = true;\nconst isActive = true;\nif (isAdmin && isActive) {\n    console.log("Access granted");\n}'
  },
  { 
    a: 'in', 
    b: 'includes', 
    aQ: 'in', 
    bQ: null, 
    note: '包含性检索。Python 的 in 是非常优雅的多用途关键字，JS 使用数组/字符串的 .includes() 方法。',
    bridge: 'Python 的 `x in container` 简洁至极；在 JS 中需要对数组和字符串显式调用 `.includes(x)`。而在 JS 中，`in` 关键字通常是用来判断属性是否存在于对象中，注意区分。',
    exampleA: 'fruits = ["apple", "banana"]\nif "apple" in fruits:\n    print("Found!")\n\nmessage = "Hello World"\nif "Hello" in message:\n    print("Greets!")',
    exampleB: 'const fruits = ["apple", "banana"];\nif (fruits.includes("apple")) {\n    console.log("Found!");\n}\n\nconst message = "Hello World";\nif (message.includes("Hello")) {\n    console.log("Greets!");\n}'
  },
  { 
    a: 'is', 
    b: '===', 
    aQ: 'is', 
    bQ: '===', 
    note: '同一性与等值性。Python is 判断内存对象 ID 是否相同，== 判断值相同；JS 用 === 判断类型及值是否完全相等。',
    bridge: '在 Python 中，`is` 用作身份比对（通常与 `None` 联用）。在 JS 中，应该始终优先使用 `===`（严格等价）以规避弱类型隐式类型转换带来的严重灾难。',
    exampleA: 'list1 = [1, 2, 3]\nlist2 = [1, 2, 3]\nlist3 = list1\n\nprint(list1 == list2)  # True (值相同)\nprint(list1 is list2)  # False (不同对象)\nprint(list1 is list3)  # True (同一内存对象)',
    exampleB: 'const arr1 = [1, 2, 3];\nconst arr2 = [1, 2, 3];\nconst arr3 = arr1;\n\nconsole.log(arr1 === arr2); // False (JS 引用类型对比的是引用地址)\nconsole.log(arr1 === arr3); // True (指向同一内存地址)\n\n// JS 严格等值比对\nconsole.log(5 === "5"); // False\nconsole.log(5 == "5");  // True (隐式转换，避坑！)'
  },
  { 
    a: 'list comprehension', 
    b: 'map/filter', 
    aQ: 'list comprehension', 
    bQ: 'arrow', 
    note: '列表推导式与高阶函数。Python 用优雅的推导式声明生成新列表，JS 用 .map() 和 .filter() 等函数式语法。',
    bridge: 'Python 推导式语法糖极其紧凑 `[x * 2 for x in nums if x > 2]`。在 JS 中，你需要通过链式调用 `.filter(x => x > 2).map(x => x * 2)` 来实现相同效果。',
    exampleA: 'numbers = [1, 2, 3, 4, 5]\n# 过滤并翻倍\ndoubled_odds = [x * 2 for x in numbers if x % 2 != 0]\nprint(doubled_odds)  # [2, 6, 10]',
    exampleB: 'const numbers = [1, 2, 3, 4, 5];\n// 过滤并翻倍\nconst doubledOdds = numbers\n  .filter(x => x % 2 !== 0)\n  .map(x => x * 2);\nconsole.log(doubledOdds); // [2, 6, 10]'
  },
  { 
    a: 'dict', 
    b: 'Object/Map', 
    aQ: 'dict', 
    bQ: 'Map', 
    note: '映射字典与对象。Python 字典是核心数据结构，JS 常用字面量普通对象（Object）或高频键值对集合（Map）。',
    bridge: 'Python 的字典可以使用动态字面量 `{key: val}` 声明。JS 的普通对象 `{key: val}` 非常相似，但 JS 对象的主键必须是字符串或 Symbol。如需任意类型主键，应使用 JS 原生 `Map`。',
    exampleA: 'user = {\n    "id": 101,\n    "name": "Alice",\n    "roles": ["admin"]\n}\n\n# 访问属性\nprint(user["name"])\nuser["active"] = True',
    exampleB: 'const user = {\n    id: 101,\n    name: "Alice",\n    roles: ["admin"]\n};\n\n// 访问属性 (支持点符号或中括号)\nconsole.log(user.name);\nconsole.log(user["name"]);\nuser.active = true;\n\n// 或是使用 ES6 Map\nconst map = new Map();\nmap.set(101, "Alice");'
  }
]

const reactVueEquivalences = [
  { 
    a: 'useState', 
    b: 'ref', 
    aQ: 'useState', 
    bQ: 'ref', 
    note: '核心状态响应。React 使用解构出的 state 变量和配套 setter 函数，Vue 用 ref 包装响应式，通过 .value 操作。',
    bridge: 'React 的 `[count, setCount] = useState(0)` 遵循纯函数不可变性：修改状态必须调用 `setCount(count + 1)`。Vue `const count = ref(0)` 使用了 Proxy 劫持：通过 `count.value++` 直接触发更新，心智上类似普通变量赋值。',
    exampleA: 'import React, { useState } from "react";\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  \n  return (\n    <button onClick={() => setCount(count + 1)}>\n      Count: {count}\n    </button>\n  );\n}',
    exampleB: '<script setup>\nimport { ref } from "vue";\n\nconst count = ref(0);\nfunction increment() {\n  count.value++; // 修改包装对象\n}\n</script>\n\n<template>\n  <button @click="increment">Count: {{ count }}</button>\n</template>'
  },
  { 
    a: 'useEffect', 
    b: 'watch/watchEffect', 
    aQ: 'useEffect', 
    bQ: 'watch', 
    note: '状态变化监听与副作用处理。React 用依赖数组触发 effect 函数；Vue 用精细的 watch 显式监控，或 watchEffect 自动追踪依赖。',
    bridge: 'React `useEffect` 在组件渲染之后根据依赖项对比执行。Vue `watch` 直接显式对特定的响应式变量进行跟踪，并提供 `(newValue, oldValue)` 完整参数，使用上更贴近直觉。',
    exampleA: 'useEffect(() => {\n  console.log("Count changed to:", count);\n  \n  // 清理函数\n  return () => {\n    console.log("Cleaning up before next effect");\n  };\n}, [count]);',
    exampleB: 'import { watch } from "vue";\n\n// 侦听变化，自动提供新旧值对比\nwatch(count, (newVal, oldVal) => {\n  console.log(`Count changed from ${oldVal} to ${newVal}`);\n});\n\n// 或是自动追踪响应式引用的 watchEffect\nwatchEffect(() => {\n  console.log("Auto-tracked counter:", count.value);\n});'
  },
  { 
    a: 'useEffect', 
    b: 'onMounted', 
    aQ: 'useEffect', 
    bQ: 'onMounted', 
    note: '组件生命周期：挂载。React 依靠传入空依赖数组 `[]` 限制副作用仅在挂载时运行一次，Vue 有语义非常明确的周期勾子 onMounted。',
    bridge: 'React 强行把声明周期融入“同步状态流”中（空依赖 `[]`）。Vue 则遵循生命周期的设计哲学，显式调用钩子 `onMounted(() => { ... })`，对传统 OOP 开发者更加友好。',
    exampleA: 'useEffect(() => {\n  console.log("Component did mount!");\n  fetchData();\n  \n  return () => {\n    console.log("Component will unmount!");\n  };\n}, []);',
    exampleB: 'import { onMounted, onUnmounted } from "vue";\n\nonMounted(() => {\n  console.log("Component did mount!");\n  fetchData();\n});\n\nonUnmounted(() => {\n  console.log("Component will unmount!");\n});'
  },
  { 
    a: 'useMemo', 
    b: 'computed', 
    aQ: 'useMemo', 
    bQ: 'computed', 
    note: '性能优化与派生数据缓存。React 需要显式指出计算函数的依赖变量数组，Vue computed 会全自动且极其精准地侦听依赖。',
    bridge: 'React 的 `useMemo` 如果忘记声明依赖项，会导致获取到陈旧的缓存数据。Vue 的 `computed` 使用了依赖收集机制，会自动把依赖追踪精准到极点，在 99% 场景下均不需要用户介入配置。',
    exampleA: 'const doubleCount = useMemo(() => {\n  return count * 2;\n}, [count]);',
    exampleB: 'import { computed } from "vue";\n\n// Vue 会自适应追踪读取 count.value，无遗漏危险\nconst doubleCount = computed(() => {\n  return count.value * 2;\n});'
  },
  { 
    a: 'useContext', 
    b: 'provide/inject', 
    aQ: 'useContext', 
    bQ: 'provide', 
    note: '跨层级上下文共享。React 使用 React.createContext() 创建并用 Provider 传递；Vue 在祖先组件中 provide，在子代中 inject。',
    bridge: 'React 必须在渲染树上显式包裹 `<Context.Provider value={...}>`。Vue 的依赖注入更加偏向业务解耦，只需在 setup 顶层运行 `provide("key", value)` 即可完成子孙层级的静默全局覆盖。',
    exampleA: '// 声明上下文\nconst ThemeContext = React.createContext("dark");\n\n// 父组件包裹\n<ThemeContext.Provider value="light">\n  <Sidebar />\n</ThemeContext.Provider>\n\n// 子组件消费\nconst theme = useContext(ThemeContext);',
    exampleB: '// 父组件提供\nimport { provide } from "vue";\nprovide("theme", "light");\n\n// 子孙组件注入消费\nimport { inject } from "vue";\nconst theme = inject("theme", "dark"); // 带有后备默认值'
  },
  { 
    a: 'JSX', 
    b: 'template', 
    aQ: 'JSX', 
    bQ: 'v-if', 
    note: '模板渲染层。React 自豪于 JavaScript All In One 的 JSX 语法，Vue 默认推荐使用单文件组件的带有丰富指令集 (v-for/v-if) 的 HTML 模板。',
    bridge: 'React 提倡直接写 JS：列表渲染用 `.map()`，条件分支用逻辑 `&&` 或三元表达式 `? :`。Vue 主张关注点分离，采用高度直观的 HTML 标签式指令如 `v-if` 和 `v-for`。',
    exampleA: 'function List({ items }) {\n  return (\n    <div className="list-container">\n      {items.length > 0 ? (\n        items.map(item => (\n          <p key={item.id}>{item.name}</p>\n        ))\n      ) : (\n        <p>No items found.</p>\n      )}\n    </div>\n  );\n}',
    exampleB: '<template>\n  <div class="list-container">\n    <template v-if="items.length > 0">\n      <p v-for="item in items" :key="item.id">\n        {{ item.name }}\n      </p>\n    </template>\n    <p v-else>No items found.</p>\n  </div>\n</template>'
  }
]

const TABS = [
  { key: 'pyjs', labelA: 'python', labelB: 'javascript', label: 'Python vs JavaScript', data: pyJsEquivalences },
  { key: 'rv', labelA: 'react', labelB: 'vue', label: 'React vs Vue', data: reactVueEquivalences },
]

export default function Compare({ cards, settings }) {
  const selectedLangs = settings?.selectedLanguages || []
  const availableTabs = useMemo(() => {
    return TABS.filter(t => selectedLangs.includes(t.labelA) && selectedLangs.includes(t.labelB))
  }, [selectedLangs])

  const [tab, setTab] = useState(availableTabs[0]?.key || 'pyjs')
  const current = useMemo(() => {
    return TABS.find(t => t.key === tab) || availableTabs[0] || TABS[0]
  }, [tab, availableTabs])

  const [selectedEqIndex, setSelectedEqIndex] = useState(0)
  const [copiedState, setCopiedState] = useState({ side: null, active: false })

  const activeEquivalence = useMemo(() => {
    if (!current?.data || current.data.length === 0) return null
    return current.data[selectedEqIndex] || current.data[0]
  }, [current, selectedEqIndex])

  const langA = LANGUAGES[current.labelA]
  const langB = LANGUAGES[current.labelB]

  // Reset index when changing tabs
  useEffect(() => {
    setSelectedEqIndex(0)
  }, [tab])

  // Run prism highlighting
  useEffect(() => {
    Prism.highlightAll()
  }, [tab, selectedEqIndex])

  const cardMap = useMemo(() => {
    const m = {}
    if (cards && Array.isArray(cards)) {
      cards.forEach(c => { m[c.keyword + '::' + c.language] = c })
    }
    return m
  }, [cards])

  const getCardStatus = (keyword, lang) => {
    if (!keyword) return 'new'
    const c = cardMap[keyword + '::' + lang]
    return c ? c.status : 'new'
  }

  const statusStyle = (status) => {
    if (status === 'mastered') return { text: '已掌握', color: 'text-state-mastered bg-state-mastered/10 border-state-mastered/20' }
    if (status === 'review' || status === 'learning') return { text: '复习中', color: 'text-brand bg-brand/10 border-brand/20' }
    return { text: '未学习', color: 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20' }
  }

  const copyToClipboard = (text, side) => {
    navigator.clipboard.writeText(text)
    setCopiedState({ side, active: true })
    setTimeout(() => {
      setCopiedState({ side: null, active: false })
    }, 2000)
  }

  if (availableTabs.length === 0) {
    return (
      <div className="space-y-6 animate-in py-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7 text-brand" /> 语言特性对比
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">通过概念映射与对照，直观理解不同编程语言之间的设计异同。</p>
        </div>

        <Card className="glass-panel border-dashed p-8 text-center max-w-lg mx-auto mt-8">
          <CardContent className="space-y-4 pt-6">
            <div className="p-3 bg-brand/10 rounded-full w-fit mx-auto border border-brand/20">
              <Compass className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-bold text-foreground">开启对照模式</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              思维对比需要您在【设置】中至少勾选两门语言才能展示：<br/>
              （例如同时选择 <strong>Python</strong> 和 <strong>JavaScript</strong>，或者同时选择 <strong>React</strong> 和 <strong>Vue</strong>）。
            </p>
            <div className="pt-2">
              <Button onClick={() => window.location.hash = '/settings'} className="bg-brand hover:bg-brand/90 text-brand-foreground font-semibold gap-2">
                前往【设置】勾选语言
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="h-7 w-7 text-brand" /> 语言特性对比
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">直观比对跨语言语法，消解转换痛点，加速掌握不同语言的设计模式。</p>
        </div>
        
        {/* Tab Selection */}
        <div className="flex gap-2 bg-zinc-900/40 p-1.5 rounded-lg border border-border/40 w-fit">
          {availableTabs.map(t => {
            const lA = LANGUAGES[t.labelA]
            const lB = LANGUAGES[t.labelB]
            const isActive = tab === t.key
            return (
              <Button
                key={t.key}
                variant={isActive ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTab(t.key)}
                className={`gap-1.5 text-xs font-bold transition-all ${isActive ? 'bg-brand text-brand-foreground shadow-lg shadow-brand/20' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <lA.icon className="h-3.5 w-3.5" />
                <span className="opacity-60">vs</span>
                <lB.icon className="h-3.5 w-3.5" />
              </Button>
            )
          })}
        </div>
      </div>

      {/* Main Split Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Concept List */}
        <div className="lg:col-span-4 space-y-3 max-h-[750px] overflow-y-auto pr-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-2">对比概念目录 ({current.data.length})</div>
          
          <div className="space-y-2">
            {current.data.map((eq, i) => {
              const isActive = selectedEqIndex === i
              const statusA = getCardStatus(eq.aQ || eq.a, current.labelA)
              const statusB = getCardStatus(eq.bQ || eq.b, current.labelB)
              const styleA = statusStyle(statusA)
              const styleB = statusStyle(statusB)

              return (
                <div
                  key={i}
                  onClick={() => setSelectedEqIndex(i)}
                  className={`glass-panel p-3.5 rounded-xl cursor-pointer transition-all duration-300 relative group flex flex-col justify-between gap-2 overflow-hidden border ${
                    isActive 
                      ? 'border-brand/60 bg-brand/5 shadow-lg shadow-brand/5' 
                      : 'border-border/50 hover:border-zinc-500/30 hover:bg-zinc-800/10'
                  }`}
                >
                  {/* Active highlight line */}
                  {isActive && <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand" />}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <code className={`font-mono text-sm font-bold ${isActive ? 'text-brand' : 'text-foreground/90'}`}>{eq.a}</code>
                      <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                      <code className={`font-mono text-sm font-bold ${isActive ? 'text-brand' : 'text-foreground/90'}`}>{eq.b || 'n/a'}</code>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${isActive ? 'translate-x-1 text-brand' : 'group-hover:translate-x-0.5'}`} />
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1 leading-normal">{eq.note}</p>

                  {/* Indicators */}
                  <div className="flex gap-2 items-center text-[10px] mt-1 pt-1.5 border-t border-border/20">
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusA === 'mastered' ? 'bg-state-mastered' : statusA === 'new' ? 'bg-zinc-600' : 'bg-brand'}`} />
                      <span className="text-muted-foreground">{LANGUAGES[current.labelA]?.label}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${statusB === 'mastered' ? 'bg-state-mastered' : statusB === 'new' ? 'bg-zinc-600' : 'bg-brand'}`} />
                      <span className="text-muted-foreground">{LANGUAGES[current.labelB]?.label}</span>
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right Column: Detailed Visualizer & Twin IDEs */}
        <div className="lg:col-span-8 space-y-6">
          {activeEquivalence ? (
            <div className="space-y-6">
              
              {/* Mental Bridge Connector */}
              <div className="glass-panel border-brand/20 bg-brand/5 p-5 rounded-2xl relative overflow-hidden">
                <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 text-brand/5 rotate-12">
                  <ArrowLeftRight className="h-32 w-32" />
                </div>
                
                <div className="flex items-center gap-2 text-sm font-bold text-brand mb-2">
                  <ArrowLeftRight className="h-4 w-4" /> 概念对照 (Concept Contrast)
                </div>
                <h3 className="text-base font-bold text-foreground mb-2 flex items-center gap-2">
                  <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-brand font-mono">{activeEquivalence.a}</code>
                  <span className="text-muted-foreground font-light">在 {langB.label} 中演化为</span>
                  <code className="px-1.5 py-0.5 rounded bg-zinc-800 text-brand font-mono">{activeEquivalence.b || '缺省'}</code>
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{activeEquivalence.bridge || activeEquivalence.note}</p>
              </div>

              {/* DUAL COGNITIVE IDE PANELS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* IDE Left: Language A */}
                <div className="rounded-2xl border border-border/40 overflow-hidden shadow-2xl bg-zinc-950 flex flex-col h-[400px]">
                  {/* Mock IDE Tab */}
                  <div className="bg-[#1e1e24] px-4 py-2 border-b border-[#2d2d39] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rating-again/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-state-learning/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-state-mastered/80" />
                      </div>
                      <span className="text-xs font-mono text-zinc-400 ml-2 select-none flex items-center gap-1.5">
                        <Terminal className="h-3 w-3" />
                        main.{langA.prism === 'jsx' ? 'jsx' : langA.prism}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyle(getCardStatus(activeEquivalence.aQ || activeEquivalence.a, current.labelA)).color}`}>
                        {statusStyle(getCardStatus(activeEquivalence.aQ || activeEquivalence.a, current.labelA)).text}
                      </Badge>
                    </div>
                  </div>

                  {/* IDE Body */}
                  <div className="p-4 flex-1 overflow-auto font-mono text-sm relative group/code bg-zinc-950">
                    {/* Floating Copy Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute right-3 top-3 opacity-0 group-hover/code:opacity-100 transition-opacity bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                      onClick={() => copyToClipboard(activeEquivalence.exampleA, 'A')}
                    >
                      {copiedState.active && copiedState.side === 'A' ? <Check className="h-4 w-4 text-state-mastered" /> : <Copy className="h-4 w-4" />}
                    </Button>

                    <div className="flex items-center gap-2 mb-3">
                      <langA.icon className={`h-5 w-5 ${langA.color}`} />
                      <span className="text-xs font-bold text-zinc-400">{langA.label}</span>
                    </div>

                    <pre className="p-0 m-0 bg-transparent overflow-x-auto whitespace-pre"><code className={`language-${langA.prism}`}>{activeEquivalence.exampleA}</code></pre>
                  </div>
                </div>

                {/* IDE Right: Language B */}
                <div className="rounded-2xl border border-border/40 overflow-hidden shadow-2xl bg-zinc-950 flex flex-col h-[400px]">
                  {/* Mock IDE Tab */}
                  <div className="bg-[#1e1e24] px-4 py-2 border-b border-[#2d2d39] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rating-again/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-state-learning/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-state-mastered/80" />
                      </div>
                      <span className="text-xs font-mono text-zinc-400 ml-2 select-none flex items-center gap-1.5">
                        <Cpu className="h-3 w-3" />
                        main.{langB.prism === 'jsx' ? 'jsx' : langB.prism}
                      </span>
                    </div>
                    {/* Status Badge */}
                    <div className="flex items-center gap-1.5">
                      {activeEquivalence.b ? (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${statusStyle(getCardStatus(activeEquivalence.bQ || activeEquivalence.b, current.labelB)).color}`}>
                          {statusStyle(getCardStatus(activeEquivalence.bQ || activeEquivalence.b, current.labelB)).text}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 text-rating-again bg-rating-again/10 border-rating-again/20">
                          不支持
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* IDE Body */}
                  <div className="p-4 flex-1 overflow-auto font-mono text-sm relative group/code bg-zinc-950">
                    {activeEquivalence.b ? (
                      <>
                        {/* Floating Copy Button */}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute right-3 top-3 opacity-0 group-hover/code:opacity-100 transition-opacity bg-zinc-900/80 hover:bg-zinc-800 text-zinc-400 hover:text-white"
                          onClick={() => copyToClipboard(activeEquivalence.exampleB, 'B')}
                        >
                          {copiedState.active && copiedState.side === 'B' ? <Check className="h-4 w-4 text-state-mastered" /> : <Copy className="h-4 w-4" />}
                        </Button>

                        <div className="flex items-center gap-2 mb-3">
                          <langB.icon className={`h-5 w-5 ${langB.color}`} />
                          <span className="text-xs font-bold text-zinc-400">{langB.label}</span>
                        </div>

                        <pre className="p-0 m-0 bg-transparent overflow-x-auto whitespace-pre"><code className={`language-${langB.prism}`}>{activeEquivalence.exampleB}</code></pre>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
                        <AlertCircle className="h-8 w-8 text-zinc-500" />
                        <h4 className="font-bold text-sm text-zinc-400">无直接等价物</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {langB.label} 并没有内置直接等效的关键字或概念。<br/>
                          请查阅说明寻找通常的设计替代方案。
                        </p>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Explanations & Notes Card */}
              <Card className="glass-panel border-border/50">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground">
                    <BookOpen className="h-4.5 w-4.5 text-brand" /> 对比注解 & 深度探究
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand" /> 语法及机制差异
                      </h4>
                      <p className="text-muted-foreground leading-relaxed text-xs">
                        {activeEquivalence.note}
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-foreground flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand" /> 迁移提醒 & 最佳实践
                      </h4>
                      <p className="text-muted-foreground leading-relaxed text-xs">
                        在从 {langA.label} 切换至 {langB.label} 时，注意在编码习惯上的转化。{langA.label} 更强调 {langA.desc}，而 {langB.label} 更偏向 {langB.desc}。
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">未选择对比条目</div>
          )}
        </div>

      </div>
    </div>
  )
}

<template>
  <div>
    <!-- 1. 测试普通文本节点 -->
    <h1>欢迎使用测试组件</h1>

    <!-- 2. 测试属性中的中文 -->
    <input :placeholder="'请输入姓名'" title="姓名输入框" />

    <!-- 3. 测试 v-bind 中的中文 -->
    <p :title="chineseTitle">这是一个段落</p>

    <!-- 4. 测试 v-if 中的中文 -->
    <span v-if="showChinese">显示中文</span>

    <!-- 5. 测试 v-for 中的中文 -->
    <ul>
      <li v-for="item in chineseList" :key="item.id">{{ item.name }}</li>
    </ul>

    <!-- 6. 测试事件处理器中的中文 -->
    <button @click="handleClick('点击了按钮')">点击我</button>

    <!-- 7. 测试插值中的中文 -->
    <p>{{ chineseMessage }}</p>

    <!-- 8. 测试混合了变量的中文字符串 -->
    <p>你好，{{ username }}！今天是 {{ today }}。</p>

    <!-- 9. 测试包含 HTML 的中文字符串 -->
    <div v-html="'<span style=\'color: red;\'>这是红色的文字</span>'"></div>

    <!-- 10. 测试自定义组件和属性中的中文 -->
    <custom-component :custom-prop="'自定义属性值'" custom-attr="自定义属性">
      自定义组件内容
    </custom-component>

    <!-- 11. 测试模板字符串 -->
    <p>{{ `这是一个模板字符串，包含变量：${username}` }}</p>

    <!-- 12. 测试带 DOM 节点和中文内容的混合字符串 -->
    <div
      v-html="`这是一段文字，包含<strong>加粗</strong>和<em>斜体</em>内容`"
    ></div>

    <!-- 13. 测试属性赋值对象中的 value 包含中文 -->
    <custom-component
      :options="{
        label: '选项1',
        value: '中文值1',
      }"
    />

    <!-- 14. 测试更复杂的模板字符串场景 -->
    <p>
      {{
        `今天是${today}，${username}有${todoCount}项待办事项：${todoList.join('、')}`
      }}
    </p>

    <!-- 15. 测试 v-bind 对象语法中的中文 -->
    <div
      v-bind="{
        title: '这是标题',
        'data-custom': '自定义数据属性',
      }"
    >
      绑定多个属性
    </div>

    <!-- 16. 测试复杂的属性绑定with HTML和模板字符串 -->
    <custom-component
      :custom-attr="templateLiteral"
      :another-attr="dynamicValue"
    >
      <span v-html="`包含 <strong>我是HTML</strong> 的内容`"></span>
      <span v-html="`嵌套的<em>强调</em>和<span>混合内容</span>`"></span>
    </custom-component>

    <!-- 17. 测试复杂的文本插值with HTML和模板字符串 -->
    <p
      v-html="
        `这是一个模<strong>板字符串</strong>，包含变量：${templateLiteral}`
      "
    ></p>

    <!-- 18. 测试不完整的HTML标签in模板字符串 -->
    <p v-html="`这是一个模<em>板字符串</em> ${templateLiteral}`"></p>

    <!-- 19. 测试v-html with 模板字符串 and 动态内容 -->
    <div
      v-html="
        `<p>这是 <strong>${dynamicContent}</strong> 和 <em>${computedContent}</em></p>`
      "
    ></div>

    <!-- 20. 测试复杂的v-for场景 -->
    <ul>
      <li v-for="item in complexList" :key="item.id">
        <span v-html="`${item.name}: <strong>${item.value}</strong>`"></span>
        <p>{{ `描述: ${item.description}` }}</p>
      </li>
    </ul>

    <!-- 21. 测试动态组件with复杂prop -->
    <component :is="currentComponent" :complex-prop="dynamicComponentContent">
      <p v-html="`组件内容: <em>${dynamicComponentContent}</em>`"></p>
    </component>

    <!-- 22. 测试使用computed属性在模板中 -->
    <p>{{ computedComplexContent }}</p>

    <!-- 23. 测试混合使用指令和复杂内容 -->
    <div
      v-if="showMixed"
      :title="`混合标题: ${mixedTitle}`"
      :class="{ 'dynamic-class': isDynamic }"
    >
      <span v-html="`混合内容: <strong>${mixedContent}</strong>`"></span>
    </div>

    <!-- 24. 测试特殊字符和HTML实体的处理 -->
    <p>{{ `特殊字符: < > & " ${specialChar}` }}</p>

    <!-- 25. 测试嵌套的模板字符串 -->
    <p>{{ `外层 ${`内层1 ${`最内层 ${deepNestedContent}`}`} 内层2` }}</p>

    <!-- 26. 测试在事件绑定中使用包含HTML的字符串 -->
    <button @click="handleClick(`点击了按钮 ${buttonIndex}`)">
      <span v-html="`点击了 <strong>按钮</strong> ${buttonIndex}`"></span>
    </button>

    <!-- 27. 测试在slot中使用复杂内容 -->
    <slot-component>
      <template #default>
        <p v-html="`默认slot: <em>${defaultSlotContent}</em>`"></p>
      </template>
      <template #named="{ prop }">
        <p
          v-html="`具名slot: <strong>${prop}</strong> 和 ${namedSlotContent}`"
        ></p>
      </template>
    </slot-component>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';

// 基本响应式数据
const chineseTitle = ref('这是中文标题');
const showChinese = ref(true);
const chineseMessage = ref('这是一条中文消息');
const username = ref('访客');
const today = ref(new Date().toLocaleDateString('zh-CN'));

// 复杂数据结构
const chineseList = ref([
  { id: 1, name: '张三' },
  { id: 2, name: '李四' },
  { id: 3, name: '王五' },
]);

const complexList = ref([
  { id: 1, name: '项目1', value: '<span>值1</span>', description: '描述 <1>' },
  { id: 2, name: '项目2', value: '<em>值2</em>', description: '描述 <2>' },
  {
    id: 3,
    name: '项目3',
    value: '<strong>值3</strong>',
    description: '描述 <3>',
  },
]);

const todoList = ref(['买菜', '洗衣服', '遛狗']);
const todoCount = computed(() => todoList.value.length);

// 动态和计算属性
const dynamicValue = ref('动态值');
const dynamicTitle = ref('动态标题');
const dynamicContent = ref('动态内容');
const computedValue = computed(() => '计算的值');
const computedContent = computed(() => '<u>计算的HTML内容</u>');

const computedComplexContent = computed(() => {
  return `计算的复杂内容: <strong>${dynamicContent.value}</strong> 和 <em>${computedValue.value}</em>`;
});

// 条件和控制变量
const showComplex = ref(true);
const currentComponent = ref('dynamic-component');
const showMixed = ref(true);
const isDynamic = ref(true);

// 特殊内容
const templateLiteral = ref(`
      <div class="container">
        <h2>产品列表</h2>
        <ul>
          <li><a href="#" title="查看详情">笔记本电脑</a></li>
          <li><a href="#" title="查看详情">智能手机</a></li>
          <li><a href="#" title="查看详情">平板电脑</a></li>
        </ul>
        <p>总计: <strong>3</strong> 项</p>
      </div>
    `);

const specialChar = ref('&copy;');
const deepNestedContent = ref('深层嵌套');
const buttonIndex = ref(1);
const defaultSlotContent = ref('默认slot内容');
const namedSlotContent = ref('具名slot内容');

// 方法
const handleClick = (message) => {
  console.log(`处理点击事件：${message}`);
  alert('你点击了按钮！');
};

// 生命周期钩子
onMounted(() => {
  console.log('组件已挂载');
  fetchData();
});

// 监听器
watch(username, (newValue, oldValue) => {
  console.log(`用户名从 ${oldValue} 变为 ${newValue}`);
});

// 异步方法
const fetchData = async () => {
  try {
    await nextTick();
    console.log('模拟异步数据获取');
    chineseMessage.value = '异步获取的新消息';
  } catch (error) {
    console.error('获取数据失败：', error);
  }
};

// 提供给父组件的方法
const updateUsername = (newName) => {
  username.value = newName;
};

// 导出给父组件使用的属性和方法
defineExpose({
  updateUsername,
  chineseMessage,
});
</script>

<script>
export default {
  name: 'TestComponent',
  inheritAttrs: false,
  props: {
    externalProp: {
      type: String,
      default: '默认外部属性',
    },
  },
  emits: ['custom-event'],
  data() {
    return {
      localData: '本地数据',
    };
  },
  computed: {
    reversedLocalData() {
      return this.localData.split('').reverse().join('');
    },
  },
  methods: {
    triggerCustomEvent() {
      this.$emit('custom-event', '自定义事件触发');
    },
  },
  // 生命周期钩子
  created() {
    console.log('组件创建');
  },
  mounted() {
    console.log('组件挂载');
  },
  // 自定义指令
  directives: {
    focus: {
      mounted(el) {
        el.focus();
      },
    },
  },
  // 插件使用示例
  install(app) {
    app.component('TestComponent', this);
  },
};
</script>

<style scoped>
/* 测试样式中的中文选择器和内容 */
.测试-class {
  content: '这是样式内容';
}

/* 测试伪类中的中文 */
.test-class:hover::after {
  content: '鼠标悬停效果';
}

/* 测试媒体查询中的中文注释 */
@media (max-width: 600px) {
  /* 小屏幕样式 */
  .测试-class {
    font-size: 14px;
  }
}
</style>

<template>
  <div>
    <!-- 1. 测试普通文本节点 -->
    <h1>{{ $t('demoTest-test-19295c377b3c0e68c-1') }}</h1>
    <!-- 2. 测试属性中的中文 -->
    <input
      :placeholder="$t('demoTest-test-19295c377b3c0e68c-2')"
      :title="$t('demoTest-test-19295c377b3c0e68c-3')"
    />
    <!-- 3. 测试 v-bind 中的中文 -->
    <p :title="chineseTitle">{{ $t('demoTest-test-19295c377b3c0e68c-4') }}</p>
    <!-- 4. 测试 v-if 中的中文 -->
    <span v-if="showChinese">{{
      $t('demoTest-test-19295c377b3c0e68c-5')
    }}</span>
    <!-- 5. 测试 v-for 中的中文 -->
    <ul>
      <li v-for="item in chineseList" :key="item.id">{{ item.name }}</li>
    </ul>
    <!-- 6. 测试事件处理器中的中文 -->
    <button @click="handleClick($t('demoTest-test-19295c377b3c0e68c-6'))">
      {{ $t('demoTest-test-19295c377b3c0e68c-7') }}
    </button>
    <!-- 7. 测试插值中的中文 -->
    <p>{{ chineseMessage }}</p>
    <!-- 8. 测试混合了变量的中文字符串 -->
    <p>
      {{ $t('demoTest-test-19295c377b3c0e68c-8') }} {{ username }}
      {{ $t('demoTest-test-19295c377b3c0e68c-9') }} {{ today }} 。
    </p>
    <!-- 9. 测试包含 HTML 的中文字符串 -->
    <div
      v-html="
        `<span style=\'color: red;\'>${$t('demoTest-test-19295c377b3c0e68c-10')}</span>`
      "
    ></div>
    <!-- 10. 测试自定义组件和属性中的中文 -->
    <custom-component
      :custom-prop="$t('demoTest-test-19295c377b3c0e68c-11')"
      :custom-attr="$t('demoTest-test-19295c377b3c0e68c-12')"
      >{{ $t('demoTest-test-19295c377b3c0e68c-13') }}</custom-component
    >
    <!-- 11. 测试模板字符串 -->
    <p>{{ `${$t('demoTest-test-19295c377b3c0e68c-14')}${username}` }}</p>
    <!-- 12. 测试带 DOM 节点和中文内容的混合字符串 -->
    <div
      v-html="
        `${$t('demoTest-test-19295c377b3c0e68c-15')}<strong>${$t('demoTest-test-19295c377b3c0e68c-16')}</strong>${$t('demoTest-test-19295c377b3c0e68c-17')}<em>${$t('demoTest-test-19295c377b3c0e68c-18')}</em>${$t('demoTest-test-19295c377b3c0e68c-19')}`
      "
    ></div>
    <!-- 13. 测试属性赋值对象中的 value 包含中文 -->
    <custom-component
      :options="`${$t('demoTest-test-19295c377b3c0e68c-14')}${username}`"
    />
    <!-- 14. 测试更复杂的模板字符串场景 -->
    <p>
      {{
        `${$t('demoTest-test-19295c377b3c0e68c-20')}，${today}${username}${$t('demoTest-test-19295c377b3c0e68c-21')}${todoCount}${$t('demoTest-test-19295c377b3c0e68c-22')}${todoList.join('、')}`
      }}
    </p>
    <!-- 15. 测试 v-bind 对象语法中的中文 -->
    <div
      v-bind="
        `${$t('demoTest-test-19295c377b3c0e68c-20')}，${today}${username}${$t('demoTest-test-19295c377b3c0e68c-21')}${todoCount}${$t('demoTest-test-19295c377b3c0e68c-22')}${todoList.join('、')}`
      "
    >
      {{ $t('demoTest-test-19295c377b3c0e68c-23') }}
    </div>
    <!-- 16. 测试复杂的属性绑定with HTML和模板字符串 -->
    <custom-component
      :custom-attr="templateLiteral"
      :another-attr="dynamicValue"
      ><span
        v-html="
          `${$t('demoTest-test-19295c377b3c0e68c-24')}<strong>${$t('demoTest-test-19295c377b3c0e68c-25')}</strong>${$t('demoTest-test-19295c377b3c0e68c-26')}`
        "
      ></span>
      <span
        v-html="
          `${$t('demoTest-test-19295c377b3c0e68c-27')}<em>${$t('demoTest-test-19295c377b3c0e68c-28')}</em>${$t('demoTest-test-19295c377b3c0e68c-29')}<span>${$t('demoTest-test-19295c377b3c0e68c-30')}</span>`
        "
      ></span
    ></custom-component>
    <!-- 17. 测试复杂的文本插值with HTML和模板字符串 -->
    <p
      v-html="
        `${$t('demoTest-test-19295c377b3c0e68c-31')}<strong>${$t('demoTest-test-19295c377b3c0e68c-32')}</strong>${$t('demoTest-test-19295c377b3c0e68c-33')}${templateLiteral}`
      "
    ></p>
    <!-- 18. 测试不完整的HTML标签in模板字符串 -->
    <p
      v-html="
        `${$t('demoTest-test-19295c377b3c0e68c-34')}<em>${$t('demoTest-test-19295c377b3c0e68c-35')}</em> ${templateLiteral}`
      "
    ></p>
    <!-- 19. 测试v-html with 模板字符串 and 动态内容 -->
    <div
      v-html="
        `<p>${$t('demoTest-test-19295c377b3c0e68c-36')}<strong>${dynamicContent}</strong>${$t('demoTest-test-19295c377b3c0e68c-37')}<em>${computedContent}</em></p>`
      "
    ></div>
    <!-- 20. 测试复杂的v-for场景 -->
    <ul>
      <li v-for="item in complexList" :key="item.id">
        <span v-html="`${item.name}: <strong>${item.value}</strong>`"></span>
        <p>
          {{ `${$t('demoTest-test-19295c377b3c0e68c-38')}${item.description}` }}
        </p>
      </li>
    </ul>
    <!-- 21. 测试动态组件with复杂prop -->
    <component :is="currentComponent" :complex-prop="dynamicComponentContent"
      ><p
        v-html="
          `${$t('demoTest-test-19295c377b3c0e68c-39')}<em>${dynamicComponentContent}</em>`
        "
      ></p
    ></component>
    <!-- 22. 测试使用computed属性在模板中 -->
    <p>{{ computedComplexContent }}</p>
    <!-- 23. 测试混合使用指令和复杂内容 -->
    <div
      v-if="showMixed"
      :title="`${$t('demoTest-test-19295c377b3c0e68c-40')}${mixedTitle}`"
      :class="{ 'dynamic-class': isDynamic }"
    >
      <span
        v-html="
          `${$t('demoTest-test-19295c377b3c0e68c-41')}<strong>${mixedContent}</strong>`
        "
      ></span>
    </div>
    <!-- 24. 测试特殊字符和HTML实体的处理 -->
    <p>{{ `${$t('demoTest-test-19295c377b3c0e68c-42')}${specialChar}` }}</p>
    <!-- 25. 测试嵌套的模板字符串 -->
    <p>
      {{
        `${$t('demoTest-test-19295c377b3c0e68c-43')}${`${$t('demoTest-test-19295c377b3c0e68c-45')}${`${$t('demoTest-test-19295c377b3c0e68c-46')}${deepNestedContent}`}`}${$t('demoTest-test-19295c377b3c0e68c-44')}`
      }}
    </p>
    <!-- 26. 测试在事件绑定中使用包含HTML的字符串 -->
    <button
      @click="
        handleClick(`${$t('demoTest-test-19295c377b3c0e68c-47')}${buttonIndex}`)
      "
    >
      <span
        v-html="
          `${$t('demoTest-test-19295c377b3c0e68c-48')}<strong>${$t('demoTest-test-19295c377b3c0e68c-49')}</strong> ${buttonIndex}`
        "
      ></span>
    </button>
    <!-- 27. 测试在slot中使用复杂内容 -->
    <slot-component
      ><template #default
        ><p
          v-html="
            `${$t('demoTest-test-19295c377b3c0e68c-50')}<em>${defaultSlotContent}</em>`
          "
        ></p
      ></template>
      <template #named="{ prop }"
        ><p
          v-html="
            `${$t('demoTest-test-19295c377b3c0e68c-51')}<strong>${prop}</strong>${$t('demoTest-test-19295c377b3c0e68c-52')}${namedSlotContent}`
          "
        ></p></template
    ></slot-component>
  </div>
</template>
<script setup>
import i18n from '@/i18n';
import { ref, computed, onMounted, watch, nextTick } from 'vue';

// 基本响应式数据
const chineseTitle = ref(i18n.t('demoTest-test-19295c377b3c0e68c-56'));
const showChinese = ref(true);
const chineseMessage = ref(i18n.t('demoTest-test-19295c377b3c0e68c-57'));
const username = ref(i18n.t('demoTest-test-19295c377b3c0e68c-58'));
const today = ref(new Date().toLocaleDateString('zh-CN'));

// 复杂数据结构
const chineseList = ref([
  { id: 1, name: i18n.t('demoTest-test-19295c377b3c0e68c-59') },
  { id: 2, name: i18n.t('demoTest-test-19295c377b3c0e68c-60') },
  { id: 3, name: i18n.t('demoTest-test-19295c377b3c0e68c-61') },
]);

const complexList = ref([
  {
    id: 1,
    name: i18n.t('demoTest-test-19295c377b3c0e68c-62'),
    value: `<span>${i18n.t('demoTest-test-19295c377b3c0e68c-63')}</span>`,
    description: i18n.t('demoTest-test-19295c377b3c0e68c-64'),
  },
  {
    id: 2,
    name: i18n.t('demoTest-test-19295c377b3c0e68c-65'),
    value: `<em>${i18n.t('demoTest-test-19295c377b3c0e68c-66')}</em>`,
    description: i18n.t('demoTest-test-19295c377b3c0e68c-67'),
  },
  {
    id: 3,
    name: i18n.t('demoTest-test-19295c377b3c0e68c-68'),
    value: `<strong>${i18n.t('demoTest-test-19295c377b3c0e68c-69')}</strong>`,
    description: i18n.t('demoTest-test-19295c377b3c0e68c-70'),
  },
]);

const todoList = ref([
  i18n.t('demoTest-test-19295c377b3c0e68c-71'),
  i18n.t('demoTest-test-19295c377b3c0e68c-72'),
  i18n.t('demoTest-test-19295c377b3c0e68c-73'),
]);
const todoCount = computed(() => todoList.value.length);

// 动态和计算属性
const dynamicValue = ref(i18n.t('demoTest-test-19295c377b3c0e68c-74'));
const dynamicTitle = ref(i18n.t('demoTest-test-19295c377b3c0e68c-75'));
const dynamicContent = ref(i18n.t('demoTest-test-19295c377b3c0e68c-76'));
const computedValue = computed(() =>
  i18n.t('demoTest-test-19295c377b3c0e68c-77'),
);
const computedContent = computed(
  () => `<u>${i18n.t('demoTest-test-19295c377b3c0e68c-78')}</u>`,
);

const computedComplexContent = computed(() => {
  return `${i18n.t('demoTest-test-19295c377b3c0e68c-79')}<strong>${dynamicContent.value}</strong>${i18n.t('demoTest-test-19295c377b3c0e68c-80')}<em>${computedValue.value}</em>`;
});

// 条件和控制变量
const showComplex = ref(true);
const currentComponent = ref('dynamic-component');
const showMixed = ref(true);
const isDynamic = ref(true);

// 特殊内容
const templateLiteral = ref(`
    <div class="container">
      <h2>${i18n.t('demoTest-test-19295c377b3c0e68c-81')}</h2>
      <ul>
        <li><a href="#" title="查看详情">${i18n.t('demoTest-test-19295c377b3c0e68c-82')}</a></li>
        <li><a href="#" title="查看详情">${i18n.t('demoTest-test-19295c377b3c0e68c-83')}</a></li>
        <li><a href="#" title="查看详情">${i18n.t('demoTest-test-19295c377b3c0e68c-84')}</a></li>
      </ul>
      <p>${i18n.t('demoTest-test-19295c377b3c0e68c-85')}<strong>3</strong>${i18n.t('demoTest-test-19295c377b3c0e68c-86')}</p>
    </div>
  `);

const specialChar = ref('&copy;');
const deepNestedContent = ref(i18n.t('demoTest-test-19295c377b3c0e68c-87'));
const buttonIndex = ref(1);
const defaultSlotContent = ref(i18n.t('demoTest-test-19295c377b3c0e68c-88'));
const namedSlotContent = ref(i18n.t('demoTest-test-19295c377b3c0e68c-89'));

// 方法
const handleClick = (message) => {
  console.log(`处理点击事件：${message}`);
  alert(i18n.t('demoTest-test-19295c377b3c0e68c-90'));
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
    chineseMessage.value = i18n.t('demoTest-test-19295c377b3c0e68c-91');
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
import i18n from '@/i18n';
export default {
  name: 'TestComponent',
  inheritAttrs: false,
  props: {
    externalProp: {
      type: String,
      default: i18n.t('demoTest-test-19295c377b3c0e68c-53'),
    },
  },
  emits: ['custom-event'],
  data() {
    return {
      localData: i18n.t('demoTest-test-19295c377b3c0e68c-54'),
    };
  },
  computed: {
    reversedLocalData() {
      return this.localData.split('').reverse().join('');
    },
  },
  methods: {
    triggerCustomEvent() {
      this.$emit('custom-event', i18n.t('demoTest-test-19295c377b3c0e68c-55'));
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

import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { register, login } from '../api-adapter.js?v=20260609-demo5';
import { toast, MobileTopBar } from '../components.js?v=20260609-demo5';
import { useDevice } from '../device.js?v=20260609-demo5';
import { authState, setAuthUser, signInLocalDemo } from '../store.js?v=20260609-demo5';

export default {
  components: { MobileTopBar },
  setup() {
    const router = useRouter();
    const { isLayoutMobile } = useDevice();
    const isLoginMode = ref(true);
    const form = ref({ nickname: '', password: '' });
    const isSubmitting = ref(false);
    const errorMsg = ref('');

    const toggleMode = () => {
      isLoginMode.value = !isLoginMode.value;
      errorMsg.value = '';
    };

    const handleSubmit = async () => {
      if (!form.value.nickname || !form.value.password) {
        errorMsg.value = '请填写昵称和密码';
        return;
      }
      isSubmitting.value = true;
      errorMsg.value = '';
      try {
        const action = isLoginMode.value ? login : register;
        const res = await action({
          nickname: form.value.nickname,
          password: form.value.password,
        });

        const user = res?.user || signInLocalDemo(form.value.nickname);
        setAuthUser(user);

        toast(isLoginMode.value ? '登录成功' : '注册成功');
        router.push('/');
      } catch (err) {
        errorMsg.value = err.message || (isLoginMode.value ? '登录失败' : '注册失败');
      } finally {
        isSubmitting.value = false;
      }
    };

    return {
      isLayoutMobile,
      isLoginMode,
      form,
      isSubmitting,
      errorMsg,
      toggleMode,
      handleSubmit,
    };
  },
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <MobileTopBar v-if="isLayoutMobile" title="账号" :back="true" />

      <div class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6">
            <div class="text-center mb-8">
              <div class="w-12 h-12 rounded-full bg-leaf-600 text-white flex items-center justify-center text-2xl mx-auto mb-3">🌿</div>
              <h2 class="text-xl font-bold text-slate-800">{{ isLoginMode ? '欢迎回到碳循校园' : '加入碳循校园' }}</h2>
              <p class="text-sm text-slate-500 mt-1">{{ isLoginMode ? '登录以继续探索和发布闲置' : '注册账号，开始你的减碳之旅' }}</p>
            </div>

            <form @submit.prevent="handleSubmit" class="space-y-4">
              <div>
                <label for="auth-nickname" class="block text-sm font-medium text-slate-700 mb-1">昵称</label>
                <input id="auth-nickname" type="text" v-model="form.nickname" autocomplete="username"
                       class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-600/50 focus:border-leaf-600 transition-colors text-slate-800 placeholder-slate-400"
                       placeholder="请输入昵称" />
              </div>

              <div>
                <label for="auth-password" class="block text-sm font-medium text-slate-700 mb-1">密码</label>
                <input id="auth-password" type="password" v-model="form.password" autocomplete="current-password"
                       class="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-leaf-600/50 focus:border-leaf-600 transition-colors text-slate-800 placeholder-slate-400"
                       placeholder="请输入密码" />
              </div>

              <div v-if="errorMsg" class="text-red-500 text-sm px-1 py-0.5 rounded bg-red-50">
                {{ errorMsg }}
              </div>

              <button type="submit" :disabled="isSubmitting"
                      class="w-full py-2.5 rounded-xl bg-leaf-600 text-white font-medium hover:bg-leaf-700 focus:outline-none focus:ring-2 focus:ring-leaf-600 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2">
                {{ isSubmitting ? '请稍候...' : (isLoginMode ? '登 录' : '注 册') }}
              </button>
            </form>

            <div class="mt-6 text-center">
              <button @click="toggleMode" class="text-sm text-leaf-600 hover:text-leaf-700 font-medium">
                {{ isLoginMode ? '没有账号？去注册' : '已有账号？去登录' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
};

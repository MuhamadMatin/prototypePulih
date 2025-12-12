export const loginFormHTML = `
<div class="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-glass relative overflow-hidden group hover:shadow-soft transition-all duration-500 hover:bg-white/70">
    <div class="absolute -top-20 -right-20 w-60 h-60 bg-green-300/20 dark:bg-green-500/10 rounded-full blur-3xl pointer-events-none opacity-60"></div>
    <div class="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none opacity-60"></div>
    <div class="relative z-10 space-y-8">
        <div>
            <h2 class="text-2xl font-bold text-text-main dark:text-white mb-2">Selamat Datang</h2>
            <p class="text-text-muted dark:text-gray-300 text-sm">Masuk untuk melanjutkan perjalanan pemulihan.</p>
        </div>
        <form class="space-y-5" id="login-form">
            <div class="space-y-1.5">
                <label class="block text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider ml-1 opacity-70">Email</label>
                <div class="relative group">
                    <input id="email" class="form-input w-full rounded-2xl border-transparent bg-white/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-12 px-4 pl-11 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base shadow-sm transition-all duration-300" placeholder="nama@email.com" type="email" required/>
                    <div class="absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                </div>
            </div>
            <div class="space-y-1.5">
                <div class="flex justify-between items-center ml-1">
                    <label class="block text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider opacity-70">Kata Sandi</label>
                    <a class="text-xs font-medium text-primary hover:text-primary-hover transition-colors" href="#">Lupa?</a>
                </div>
                <div class="relative group">
                    <input id="password" class="form-input w-full rounded-2xl border-transparent bg-white/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-12 px-4 pl-11 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base shadow-sm transition-all duration-300" placeholder="••••••••" type="password" required/>
                    <div class="absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                    <button class="absolute right-4 top-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none" type="button">
                        <span class="material-symbols-outlined text-[20px]">visibility_off</span>
                    </button>
                </div>
            </div>
            <button type="submit" class="w-full cursor-pointer flex items-center justify-center gap-2 rounded-2xl h-12 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all text-[#0d1b10] text-base font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40">
                <span>Masuk Sekarang</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
        </form>
        <div class="relative flex py-2 items-center">
            <div class="flex-grow border-t border-gray-400/30 dark:border-gray-600/50"></div>
            <span class="flex-shrink-0 mx-4 text-gray-500 dark:text-gray-400 text-[10px] uppercase tracking-widest font-bold opacity-60">Pilihan Lain</span>
            <div class="flex-grow border-t border-gray-400/30 dark:border-gray-600/50"></div>
        </div>
        <div class="bg-gradient-to-br from-white/40 to-white/20 dark:from-white/5 dark:to-white/0 border border-white/50 dark:border-white/10 rounded-2xl p-4 text-center backdrop-blur-sm">
            <div class="flex items-center justify-center gap-2 mb-2">
                <span class="material-symbols-outlined text-gray-600 dark:text-gray-300 text-[20px]">visibility_off</span>
                <span class="font-bold text-sm text-gray-700 dark:text-gray-200">Mode Incognito</span>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed opacity-80">
                Akses konseling tanpa data pribadi. Privasi Anda terjaga.
            </p>
            <button id="btn-anon" class="w-full cursor-pointer rounded-xl h-10 border border-gray-300/60 dark:border-gray-600 hover:border-primary hover:text-primary dark:hover:text-primary hover:bg-primary/5 transition-all text-sm font-semibold text-gray-600 dark:text-gray-300 bg-white/40 dark:bg-black/20">
                Lanjut sebagai Anonim
            </button>
        </div>
        <div class="text-center">
            <p class="text-text-muted dark:text-gray-400 text-sm">
                Belum punya akun? <a id="link-signup" class="text-primary font-bold hover:underline cursor-pointer">Daftar</a>
            </p>
        </div>
    </div>
</div>
`;

export const signupFormHTML = `
<div class="bg-white/60 dark:bg-surface-dark/60 backdrop-blur-xl border border-white/60 dark:border-white/10 rounded-[2.5rem] p-8 lg:p-10 shadow-glass relative overflow-hidden group hover:shadow-soft transition-all duration-500 hover:bg-white/70">
    <div class="absolute -top-20 -right-20 w-60 h-60 bg-green-300/20 dark:bg-green-500/10 rounded-full blur-3xl pointer-events-none opacity-60"></div>
    <div class="absolute -bottom-20 -left-20 w-60 h-60 bg-primary/10 dark:bg-primary/5 rounded-full blur-3xl pointer-events-none opacity-60"></div>
    <div class="relative z-10 space-y-8">
        <div>
            <h2 class="text-2xl font-bold text-text-main dark:text-white mb-2">Buat Akun Baru</h2>
            <p class="text-text-muted dark:text-gray-300 text-sm">Bergabung dengan komunitas kami yang aman.</p>
        </div>
        <form class="space-y-4" id="signup-form">
            <div class="space-y-1.5">
                <label class="block text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider ml-1 opacity-70">Nama Lengkap</label>
                <div class="relative group">
                    <input id="signup-name" class="form-input w-full rounded-2xl border-transparent bg-white/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-12 px-4 pl-11 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base shadow-sm transition-all duration-300" placeholder="Nama Anda" type="text" required/>
                    <div class="absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">person</span>
                    </div>
                </div>
            </div>
            <div class="space-y-1.5">
                <label class="block text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider ml-1 opacity-70">Email</label>
                <div class="relative group">
                    <input id="signup-email" class="form-input w-full rounded-2xl border-transparent bg-white/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-12 px-4 pl-11 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base shadow-sm transition-all duration-300" placeholder="nama@email.com" type="email" required/>
                    <div class="absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                </div>
            </div>
            <div class="space-y-1.5">
                <label class="block text-text-main dark:text-gray-200 text-xs font-bold uppercase tracking-wider ml-1 opacity-70">Kata Sandi</label>
                <div class="relative group">
                    <input id="signup-password" class="form-input w-full rounded-2xl border-transparent bg-white/50 dark:bg-black/20 focus:bg-white dark:focus:bg-black/40 focus:border-primary/50 focus:ring-4 focus:ring-primary/10 h-12 px-4 pl-11 placeholder:text-gray-400 dark:placeholder:text-gray-500 text-base shadow-sm transition-all duration-300" placeholder="••••••••" type="password" required/>
                    <div class="absolute left-4 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">lock</span>
                    </div>
                </div>
            </div>
            <button type="submit" class="w-full cursor-pointer flex items-center justify-center gap-2 rounded-2xl h-12 bg-primary hover:bg-primary-hover active:scale-[0.98] transition-all text-[#0d1b10] text-base font-bold shadow-lg shadow-green-500/20 hover:shadow-green-500/40">
                <span>Daftar Sekarang</span>
                <span class="material-symbols-outlined text-[18px]">how_to_reg</span>
            </button>
        </form>
        <div class="text-center pt-2">
            <p class="text-text-muted dark:text-gray-400 text-sm">
                Sudah punya akun? <a id="link-login" class="text-primary font-bold hover:underline cursor-pointer">Masuk</a>
            </p>
        </div>
    </div>
</div>
`;

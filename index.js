const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// Konfigurasi
const BOT_TOKEN = '8684515294:AAFrzbkh-n-YKcotYUt1RMS6Muf3I-fGusk';
const OWNER_ID = 7533630775;
const QRIS_URL = 'https://raw.githubusercontent.com/ManzzyGacor/Urlmanzzy/main/file_1776583050697_289.jpg';
const KONTAK_OWNER = 't.me/Manjikeduwa';
const LOG_CHAT_ID = -1003349106139;

const bot = new Telegraf(BOT_TOKEN);

// Inisialisasi Database
const dbFile = './database.json';
let db = { users: {}, stocks: {} };

if (fs.existsSync(dbFile)) {
    db = JSON.parse(fs.readFileSync(dbFile));
}

// 🧹 AUTO CLEANUP KATEGORI YANG SALAH
const kategoriValid = ["alight motion", "viu lifetime"];
for (let key in db.stocks) {
    if (!kategoriValid.includes(key)) {
        delete db.stocks[key]; // Hapus kategori nyasar dari database
    }
}
// Pastikan kategori wajib ada
kategoriValid.forEach(cat => {
    if (!db.stocks[cat]) db.stocks[cat] = [];
});

const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));
saveDb(); // Save hasil cleanup

// Helper Fungsi
function getRoleName(role) {
    switch (role) {
        case 1: return 'Cupu (Member)';
        case 2: return 'Reseller';
        case 3: return 'Reseller VIP';
        case 4: return 'Raja 👑 (Owner)';
        default: return 'Tidak Diketahui';
    }
}

function getStockStats() {
    const am = db.stocks["alight motion"] ? db.stocks["alight motion"].length : 0;
    const viu = db.stocks["viu lifetime"] ? db.stocks["viu lifetime"].length : 0;
    return { am, viu };
}

async function sendLog(ctx, message) {
    const time = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });
    const logMessage = `📜 *LOG AKTIVITAS*\n\n` +
                       `👤 *User:* ${ctx.from.first_name} (@${ctx.from.username || '-'})\n` +
                       `🆔 *ID:* \`${ctx.from.id}\`\n` +
                       `⏰ *Waktu:* ${time}\n` +
                       `📝 *Aksi:* ${message}`;
    try {
        await ctx.telegram.sendMessage(LOG_CHAT_ID, logMessage, { parse_mode: 'Markdown' });
    } catch (err) {
        console.error("Gagal kirim log:", err);
    }
}

// --- MENU UTAMA ---
const showMainMenu = (ctx) => {
    const userId = ctx.from.id.toString();
    
    if (!db.users[userId]) {
        db.users[userId] = { role: 1, lastAmbil: 0, lastAmbil10: 0, hasTakenViu: false };
    }

    const username = ctx.from.username ? ctx.from.username.toLowerCase() : '';
    if (username === 'man' || username === 'manjikeduwa') {
        db.users[userId].role = 4; 
    }

    saveDb();

    const user = db.users[userId];
    const roleName = getRoleName(user.role);
    const { am, viu } = getStockStats();

    let buttons = [
        [Markup.button.callback('🛒 Cek & Ambil Akun', 'menu_ambil')],
        [Markup.button.callback('🚀 Upgrade Role', 'menu_upgrade')],
        [Markup.button.callback('👨‍💻 Owner / Bantuan', 'menu_bantuan')]
    ];

    if (user.role === 4) {
        buttons.push([Markup.button.callback('⚙️ ADMIN PANEL ⚙️', 'admin_panel')]);
    }

    let text = `╔════════════════════╗\n` +
               `   ✨ *MANZZY ID STOCK BOT* ✨\n` +
               `╚════════════════════╝\n\n` +
               `👤 *User:* ${ctx.from.first_name}\n` +
               `🆔 *ID:* \`${userId}\`\n` +
               `👑 *Role:* ${roleName}\n\n` +
               `📊 *STATISTIK STOK:*\n` +
               `• Alight Motion: [ ${am} ]\n` +
               `• Viu Lifetime: [ ${user.role >= 3 ? viu : '🔒 Khusus VIP'} ]\n\n` +
               `💰 *DAFTAR HARGA UPGRADE:*\n` +
               `• Member ➔ Reseller: *Rp 10.000*\n` +
               `• Member ➔ VIP: *Rp 15.000*\n` +
               `• Reseller ➔ VIP: *Rp 7.000*\n\n` +
               `_Silakan pilih menu di bawah:_`;

    return ctx.reply(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
    });
};

bot.start(showMainMenu);
bot.command('menu', showMainMenu);

bot.action('back_to_menu', (ctx) => {
    ctx.deleteMessage().catch(() => {}); 
    showMainMenu(ctx);
});

// --- COMMAND OWNER ---

// Format baru: /addstock am data ATAU /addstock viu data
bot.command('addstock', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return ctx.reply('Akses ditolak!');

    const args = ctx.message.text.trim().split(' ');
    if (args.length < 3) {
        return ctx.reply('❌ Format salah!\nGunakan: `/addstock <am/viu> <data_akun>`\nContoh: `/addstock am user:pass`', {parse_mode: 'Markdown'});
    }

    const kode = args[1].toLowerCase();
    const dataAkun = args.slice(2).join(' ');

    let kategoriSebenarnya = '';
    if (kode === 'am' || kode === 'alight') kategoriSebenarnya = 'alight motion';
    else if (kode === 'viu') kategoriSebenarnya = 'viu lifetime';
    else return ctx.reply('❌ Kategori tidak dikenali! Hanya bisa pakai `am` atau `viu`.');

    db.stocks[kategoriSebenarnya].push(dataAkun);
    saveDb();

    await sendLog(ctx, `Menambahkan stok ke kategori *${kategoriSebenarnya}*`);
    ctx.reply(`✅ Berhasil tambah stok *${kategoriSebenarnya}*.\nTotal sekarang: ${db.stocks[kategoriSebenarnya].length}`, {parse_mode: 'Markdown'});
});

bot.command('setrole', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return ctx.reply('Akses ditolak!');

    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('Format: `/setrole <1-4> <id>`', {parse_mode: 'Markdown'});

    const targetRole = parseInt(args[1]);
    const targetId = args[2];

    if (![1, 2, 3, 4].includes(targetRole)) return ctx.reply('Role tidak valid (1-4).');
    if (!db.users[targetId]) return ctx.reply('User ID belum terdaftar di bot.');

    db.users[targetId].role = targetRole;
    saveDb();

    await sendLog(ctx, `Mengubah Role User \`${targetId}\` menjadi *${getRoleName(targetRole)}*`);
    ctx.reply(`✅ Role user \`${targetId}\` sukses diubah jadi *${getRoleName(targetRole)}*.`, {parse_mode: 'Markdown'});
});

bot.command('broadcast', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return;

    const pesan = ctx.message.text.split(' ').slice(1).join(' ');
    if (!pesan) return ctx.reply('Masukkan pesan broadcast!');

    const allUsers = Object.keys(db.users);
    let success = 0;

    for (let id of allUsers) {
        try {
            await ctx.telegram.sendMessage(id, `📢 *PENGUMUMAN DARI OWNER*\n\n${pesan}`, { parse_mode: 'Markdown' });
            success++;
        } catch (e) {}
    }

    ctx.reply(`✅ Broadcast terkirim ke ${success} user.`);
    await sendLog(ctx, `Mengirim broadcast ke ${success} user.`);
});

// --- ACTION TOMBOL UTAMA ---

bot.action('menu_upgrade', (ctx) => {
    const userId = ctx.from.id.toString();
    const role = db.users[userId].role;
    
    let buttons = [];
    if (role === 1) {
        buttons.push([Markup.button.callback('⬆️ Reseller (Rp 10.000)', 'pay_reseller')]);
        buttons.push([Markup.button.callback('💎 Reseller VIP (Rp 15.000)', 'pay_vip_member')]);
    } else if (role === 2) {
        buttons.push([Markup.button.callback('💎 Upgrade VIP (Rp 7.000)', 'pay_vip_reseller')]);
    } else {
        return ctx.answerCbQuery('Kamu sudah berada di role tertinggi!', {show_alert: true});
    }

    ctx.editMessageText('Pilih paket upgrade yang kamu inginkan:', {
        ...Markup.inlineKeyboard([
            ...buttons,
            [Markup.button.callback('⬅️ Kembali', 'back_to_menu')]
        ])
    });
});

bot.action(/pay_/, (ctx) => {
    const action = ctx.match.input;
    let harga = '';
    
    if (action === 'pay_reseller') harga = 'Rp 10.000';
    if (action === 'pay_vip_member') harga = 'Rp 15.000';
    if (action === 'pay_vip_reseller') harga = 'Rp 7.000';

    ctx.deleteMessage().catch(() => {});
    ctx.replyWithPhoto(QRIS_URL, {
        caption: `💳 *Pembayaran Upgrade Role*\n\nSilakan scan QRIS di atas sebesar *${harga}*.\n\nKirim bukti ke [Owner Bot](https://${KONTAK_OWNER}) beserta ID Telegram kamu: \`${ctx.from.id}\`.`,
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali ke Menu', 'back_to_menu')]])
    });
});

bot.action('menu_bantuan', (ctx) => {
    ctx.editMessageText(`👨‍💻 Untuk bantuan atau konfirmasi pembayaran, hubungi Owner:\nhttps://${KONTAK_OWNER}`, {
        disable_web_page_preview: true,
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali', 'back_to_menu')]])
    });
});

bot.action('admin_panel', (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return ctx.answerCbQuery('Akses Ditolak!', { show_alert: true });

    const totalUser = Object.keys(db.users).length;
    const { am, viu } = getStockStats();

    let text = `⚙️ *ADMIN PANEL - MANZZY ID*\n\n` +
               `👥 Total User: ${totalUser}\n` +
               `📦 Total Stok AM: ${am}\n` +
               `📦 Total Stok Viu: ${viu}\n\n` +
               `*Quick Command Owner:* \n` +
               `• \`/setrole <role> <id>\`\n` +
               `• \`/addstock <am/viu> <data>\`\n` +
               `• \`/broadcast <pesan>\``;

    ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('⬅️ Kembali', 'back_to_menu')]
        ])
    });
});

// --- MENU AMBIL & AMBIL AKUN ---

bot.action('menu_ambil', (ctx) => {
    const userId = ctx.from.id.toString();
    const user = db.users[userId];

    if (user.role === 1) {
        return ctx.answerCbQuery('❌ Member Cupu tidak bisa ambil stock! Upgrade ke Reseller dulu.', { show_alert: true });
    }

    let buttons = [];
    const categories = ["alight motion", "viu lifetime"];

    categories.forEach(cat => {
        const sisa = db.stocks[cat] ? db.stocks[cat].length : 0;
        
        if (cat === 'viu lifetime') {
            if (user.role < 3) return; // VIP/Owner Only
            if (user.hasTakenViu) {
                buttons.push([Markup.button.callback(`🚫 VIU LIFETIME (Sudah Klaim)`, `already_claimed`)]);
                return;
            }
        }

        if (sisa > 0) {
            buttons.push([Markup.button.callback(`🛒 Ambil ${cat.toUpperCase()} (Sisa: ${sisa})`, `take1_${cat}`)]);
            if (user.role >= 3 && sisa >= 10 && cat !== 'viu lifetime') {
                buttons.push([Markup.button.callback(`🔥 Borong 10 ${cat.toUpperCase()}`, `take10_${cat}`)]);
            }
        } else {
            buttons.push([Markup.button.callback(`🚫 ${cat.toUpperCase()} (Kosong)`, `empty_stock`)]);
        }
    });

    if (buttons.length === 0) {
        return ctx.editMessageText('🛒 *Sistem Akun*\n\nMaaf, belum ada stok tersedia.', { parse_mode: 'Markdown', ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali', 'back_to_menu')]]) });
    }

    buttons.push([Markup.button.callback('⬅️ Kembali ke Menu', 'back_to_menu')]);

    ctx.editMessageText('🛒 *Pilih kategori akun:*\n\nKlik tombol di bawah:', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
    });
});

bot.action('empty_stock', (ctx) => ctx.answerCbQuery('❌ Stok sedang habis!', { show_alert: true }));
bot.action('already_claimed', (ctx) => ctx.answerCbQuery('❌ Kamu sudah pernah mengambil Viu Lifetime (Cuma 1x)!', { show_alert: true }));

bot.action(/^take1_(.+)$/, async (ctx) => {
    const kategori = ctx.match[1];
    const userId = ctx.from.id.toString();
    const user = db.users[userId];

    if (kategori === 'viu lifetime') {
        if (user.role < 3) return ctx.answerCbQuery('❌ Khusus VIP!', { show_alert: true });
        if (user.hasTakenViu) return ctx.answerCbQuery('❌ Jatah Viu habis!', { show_alert: true });
    }

    if (!db.stocks[kategori] || db.stocks[kategori].length < 1) {
        return ctx.answerCbQuery('❌ Stok habis!', { show_alert: true });
    }

    const now = Date.now();
    if (user.role === 2) { 
        const cooldown = 60 * 1000; 
        if (now - user.lastAmbil < cooldown) {
            const sisa = Math.ceil((cooldown - (now - user.lastAmbil)) / 1000);
            return ctx.answerCbQuery(`⏳ Tunggu ${sisa} detik lagi.`, { show_alert: true });
        }
        user.lastAmbil = now;
    }

    const diambil = db.stocks[kategori].shift(); 
    if (kategori === 'viu lifetime') user.hasTakenViu = true;
    saveDb();

    await sendLog(ctx, `Mengambil 1 akun *${kategori.toUpperCase()}*`);
    ctx.answerCbQuery(`✅ Berhasil!`);
    
    ctx.deleteMessage().catch(() => {});
    ctx.reply(`✅ *DATA AKUN ${kategori.toUpperCase()}*\n\n\`${diambil}\``, { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali ke Menu', 'back_to_menu')]])
    });
});

bot.action(/^take10_(.+)$/, async (ctx) => {
    const kategori = ctx.match[1];
    const userId = ctx.from.id.toString();
    const user = db.users[userId];

    if (user.role < 3) return ctx.answerCbQuery('❌ Hanya untuk VIP!', { show_alert: true });
    if (kategori === 'viu lifetime') return ctx.answerCbQuery('❌ Viu tidak bisa diborong!', { show_alert: true });
    if (db.stocks[kategori].length < 10) return ctx.answerCbQuery('❌ Stok tidak cukup 10.', { show_alert: true });

    const now = Date.now();
    if (user.role === 3) { 
        const cooldown = 5 * 60 * 1000; 
        if (now - user.lastAmbil10 < cooldown) {
            const sisaMnt = Math.ceil((cooldown - (now - user.lastAmbil10)) / 1000 / 60);
            return ctx.answerCbQuery(`⏳ Tunggu ${sisaMnt} menit lagi.`, { show_alert: true });
        }
        user.lastAmbil10 = now;
    }

    const diambil = db.stocks[kategori].splice(0, 10);
    saveDb();

    await sendLog(ctx, `Memborong 10 akun *${kategori.toUpperCase()}*`);
    ctx.answerCbQuery(`✅ Borong berhasil!`);
    
    let msgText = `🔥 *BORONG 10 AKUN ${kategori.toUpperCase()}*\n\n`;
    diambil.forEach((akun, i) => { msgText += `${i + 1}. \`${akun}\`\n`; });

    ctx.deleteMessage().catch(() => {});
    ctx.reply(msgText, { 
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([[Markup.button.callback('⬅️ Kembali ke Menu', 'back_to_menu')]])
    });
});

// Jalankan Bot
bot.launch().then(() => console.log('Bot berhasil dijalankan!'));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
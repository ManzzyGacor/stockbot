const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

// Konfigurasi
const BOT_TOKEN = '8684515294:AAFrzbkh-n-YKcotYUt1RMS6Muf3I-fGusk';
const OWNER_ID = 7533630775; // Ganti dengan ID Telegram kamu
const QRIS_URL = 'https://raw.githubusercontent.com/ManzzyGacor/Urlmanzzy/main/file_1776583050697_289.jpg'; // URL gambar QRIS
const KONTAK_OWNER = 't.me/Manjikeduwa';
const LOG_CHAT_ID = -1003349106139; // Ganti dengan ID Group/Channel Log kamu

const bot = new Telegraf(BOT_TOKEN);

// Inisialisasi Database (Simple JSON)
const dbFile = './database.json';
let db = { users: {}, stocks: {} };

if (fs.existsSync(dbFile)) {
    db = JSON.parse(fs.readFileSync(dbFile));
}
const saveDb = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// Helper: Nama Role
function getRoleName(role) {
    switch (role) {
        case 1: return 'Cupu (Member)';
        case 2: return 'Reseller';
        case 3: return 'Reseller VIP';
        case 4: return 'Raja 👑 (Owner)';
        default: return 'Tidak Diketahui';
    }
}

// Command: /start
// Helper untuk menghitung total stok
function getStockStats() {
    const am = db.stocks["alight motion"] ? db.stocks["alight motion"].length : 0;
    const viu = db.stocks["viu lifetime"] ? db.stocks["viu lifetime"].length : 0;
    return { am, viu };
}

const showMainMenu = (ctx) => {
    const userId = ctx.from.id.toString();
    
    // Inisialisasi user jika belum ada
    if (!db.users[userId]) {
        db.users[userId] = { role: 1, lastAmbil: 0, lastAmbil10: 0 };
    }

    // Auto-admin
    const username = ctx.from.username ? ctx.from.username.toLowerCase() : '';
    if (username === 'man' || username === 'manjikeduwa') {
        db.users[userId].role = 4; 
    }

    const user = db.users[userId];
    const roleName = getRoleName(user.role);
    const { am, viu } = getStockStats();

    // Setup array tombol bawaan
    let buttons = [
        [Markup.button.callback('🛒 Cek & Ambil Akun', 'menu_ambil')],
        [Markup.button.callback('🚀 Upgrade Role', 'menu_upgrade')],
        [Markup.button.callback('👨‍💻 Owner / Bantuan', 'menu_bantuan')]
    ];

    // Tambahkan tombol ADMIN PANEL jika user adalah Raja 👑
    if (user.role === 4) {
        buttons.push([Markup.button.callback('⚙️ ADMIN PANEL ⚙️', 'admin_panel')]);
    }

    let text = `╔════════════════════╗\n`;
    text += `   ✨ *MANZZY ID STOCK BOT* ✨\n`;
    text += `╚════════════════════╝\n\n`;
    text += `👤 *User:* ${ctx.from.first_name}\n`;
    text += `🆔 *ID:* \`${userId}\`\n`;
    text += `👑 *Role:* ${roleName}\n\n`;

    text += `📊 *STATISTIK STOK:*\n`;
    text += `• Alight Motion: [ ${am} ]\n`;
    
    // Informasi stok Viu disembunyikan jika bukan VIP/Owner
    if (user.role >= 3) {
        text += `• Viu Lifetime: [ ${viu} ]\n`;
    } else {
        text += `• Viu Lifetime: [ 🔒 Khusus VIP ]\n`;
    }

    text += `\n💰 *DAFTAR HARGA UPGRADE:*\n`;
    text += `• Member ➔ Reseller: *Rp 10.000*\n`;
    text += `• Member ➔ VIP: *Rp 15.000*\n`;
    text += `• Reseller ➔ VIP: *Rp 7.000*\n\n`;
    text += `_Silakan pilih menu di bawah untuk transaksi:_`;

    return ctx.reply(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
    });
};

// Daftarkan Command
bot.start(showMainMenu);
bot.command('menu', showMainMenu);

// Update juga bagian action menu_ambil agar bisa kembali ke menu utama
bot.action('back_to_menu', (ctx) => {
    ctx.deleteMessage().catch(() => {}); // Hapus pesan lama agar bersih dan anti-crash
    showMainMenu(ctx);
});

// Daftarkan Command
bot.start(showMainMenu);
bot.command('menu', showMainMenu);

// Update juga bagian action menu_ambil agar bisa kembali ke menu utama
bot.action('back_to_menu', (ctx) => {
    ctx.deleteMessage(); // Hapus pesan lama agar bersih
    showMainMenu(ctx);
});

// Action: Upgrade Role
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
        return ctx.reply('Kamu sudah berada di role tertinggi (Reseller VIP) atau kamu adalah Raja 👑.');
    }

    ctx.reply('Pilih paket upgrade yang kamu inginkan:', Markup.inlineKeyboard(buttons));
});

// Action: Proses Pembayaran (Menampilkan QRIS)
bot.action(/pay_/, (ctx) => {
    const action = ctx.match.input;
    let harga = '';
    
    if (action === 'pay_reseller') harga = 'Rp 10.000';
    if (action === 'pay_vip_member') harga = 'Rp 15.000';
    if (action === 'pay_vip_reseller') harga = 'Rp 7.000';

    ctx.replyWithPhoto(QRIS_URL, {
        caption: `💳 *Pembayaran Upgrade Role*\n\nSilakan scan QRIS di atas untuk melakukan pembayaran sebesar *${harga}*.\n\nJika sudah transfer, kirimkan bukti ke [Owner Bot](https://${KONTAK_OWNER}) beserta ID Telegram kamu: \`${ctx.from.id}\` untuk diproses.`,
        parse_mode: 'Markdown'
    });
});

// Action: Bantuan
bot.action('menu_bantuan', (ctx) => {
    ctx.reply(`Untuk bantuan atau konfirmasi pembayaran, hubungi: https://${KONTAK_OWNER}`);
});

// Command Owner: /setrole <1-4> <id_telegram>
bot.command('setrole', (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return ctx.reply('Akses ditolak! Cuma Raja 👑 yang bisa pakai ini.');

    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('Format salah!\nGunakan: `/setrole <1/2/3/4> <id_telegram>`', {parse_mode: 'Markdown'});

    const targetRole = parseInt(args[1]);
    const targetId = args[2];

    if (![1, 2, 3, 4].includes(targetRole)) return ctx.reply('Role tidak valid. (1=Member, 2=Reseller, 3=VIP, 4=Owner)');
    if (!db.users[targetId]) return ctx.reply('User ID tersebut belum pernah start bot ini.');

    db.users[targetId].role = targetRole;
    saveDb();
    ctx.reply(`Sukses! Role user \`${targetId}\` telah diubah menjadi *${getRoleName(targetRole)}*.`, {parse_mode: 'Markdown'});
});

// Command Owner: /addstock <kategori> <data_akun>
bot.command('addstock', (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return ctx.reply('Akses ditolak!');

    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('Format salah!\nGunakan: `/addstock <kategori> <data_akun>`\nContoh: `/addstock am user:pass`', {parse_mode: 'Markdown'});

    const kategori = args[1].toLowerCase();
    const dataAkun = args.slice(2).join(' '); // Menggabungkan spasi jika data akun panjang

    if (!db.stocks[kategori]) db.stocks[kategori] = [];
    db.stocks[kategori].push(dataAkun);
    saveDb();

    ctx.reply(`✅ Berhasil menambahkan stock ke kategori *${kategori}*.\nTotal stock sekarang: ${db.stocks[kategori].length}`, {parse_mode: 'Markdown'});
});

// Action: Lihat Stock (Informasi Kategori)
bot.action('menu_ambil', (ctx) => {
    let msg = '🛒 *Daftar Kategori Akun Tersedia*\n\n';
    const categories = Object.keys(db.stocks);
    
    if (categories.length === 0) {
        msg += 'Belum ada stock yang tersedia.';
    } else {
        categories.forEach(cat => {
            msg += `- *${cat}* (Sisa: ${db.stocks[cat].length})\n`;
        });
        msg += '\n*Cara Ambil:*\nKetik `/ambil <kategori>` (untuk 1 akun)\nKetik `/ambil10 <kategori>` (khusus VIP ambil 10)';
    }
    ctx.reply(msg, { parse_mode: 'Markdown' });
});

// Database awal dengan kategori yang sudah ditentukan
// Jika database.json belum ada, bot akan pakai template ini
if (!fs.existsSync(dbFile)) {
    db = { 
        users: {}, 
        stocks: {
            "alight motion": [],
            "viu lifetime": []
        } 
    };
    saveDb();
}

// Action: Lihat Stock & Munculin Button (Disesuaikan dengan Role)
bot.action('menu_ambil', (ctx) => {
    const userId = ctx.from.id.toString();
    const user = db.users[userId];

    if (user.role === 1) {
        return ctx.answerCbQuery('❌ Member Cupu tidak bisa ambil stock! Upgrade ke Reseller dulu.', { show_alert: true });
    }

    let buttons = [];
    const categories = Object.keys(db.stocks);

    categories.forEach(cat => {
        const sisa = db.stocks[cat].length;
        
        // LOGIKA AKSES KATEGORI:
        // Viu Lifetime khusus Reseller VIP (Role 3) atau Owner (Role 4)
        if (cat.toLowerCase() === 'viu lifetime') {
            if (user.role < 3) return; // Skip jika bukan VIP/Owner
        }

        if (sisa > 0) {
            buttons.push([Markup.button.callback(`🛒 Ambil ${cat.toUpperCase()} (Sisa: ${sisa})`, `take1_${cat}`)]);
            
            // Tombol Borong 10 (Hanya untuk VIP/Owner dan stok cukup)
            if (user.role >= 3 && sisa >= 10) {
                buttons.push([Markup.button.callback(`🔥 Borong 10 ${cat.toUpperCase()}`, `take10_${cat}`)]);
            }
        } else {
            // Jika stok kosong tetap tampilkan tapi beri info kosong
            buttons.push([Markup.button.callback(`🚫 ${cat.toUpperCase()} (Kosong)`, `empty_stock`)]);
        }
    });

    if (buttons.length === 0) {
        return ctx.editMessageText('🛒 *Sistem Akun*\n\nMaaf, belum ada stok yang tersedia untuk level role kamu.', { parse_mode: 'Markdown' });
    }

    ctx.editMessageText('🛒 *Pilih kategori akun:*\n\nKlik tombol di bawah untuk mengambil:', {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard(buttons)
    });
});

// Action: Handle Stok Kosong
bot.action('empty_stock', (ctx) => {
    ctx.answerCbQuery('❌ Stok untuk kategori ini sedang habis!', { show_alert: true });
});

// Action: Tombol Ambil 1 Akun
bot.action(/^take1_(.+)$/, (ctx) => {
    const kategori = ctx.match[1];
    const userId = ctx.from.id.toString();
    const user = db.users[userId];

    // Cek ulang keamanan role untuk Viu Lifetime
    if (kategori.toLowerCase() === 'viu lifetime' && user.role < 3) {
        return ctx.answerCbQuery('❌ Khusus Reseller VIP!', { show_alert: true });
    }

    if (!db.stocks[kategori] || db.stocks[kategori].length < 1) {
        return ctx.answerCbQuery('❌ Stok habis!', { show_alert: true });
    }

    const now = Date.now();
    // Cooldown Reseller biasa (Role 2) = 1 Menit
    if (user.role === 2) { 
        const cooldown = 60 * 1000; 
        if (now - user.lastAmbil < cooldown) {
            const sisa = Math.ceil((cooldown - (now - user.lastAmbil)) / 1000);
            return ctx.answerCbQuery(`⏳ Tunggu ${sisa} detik lagi.`, { show_alert: true });
        }
        user.lastAmbil = now;
    }

    const diambil = db.stocks[kategori].shift(); 
    saveDb();

    ctx.answerCbQuery(`✅ Akun ${kategori.toUpperCase()} berhasil diambil!`);
    ctx.reply(`✅ *DATA AKUN ${kategori.toUpperCase()}*\n\n\`${diambil}\`\n\n_Stok otomatis dihapus dari database._`, { parse_mode: 'Markdown' });
});

// Action: Tombol Ambil 10 Akun (Khusus VIP)
bot.action(/^take10_(.+)$/, (ctx) => {
    const kategori = ctx.match[1];
    const userId = ctx.from.id.toString();
    const user = db.users[userId];

    if (user.role < 3) return ctx.answerCbQuery('❌ Hanya untuk VIP!', { show_alert: true });
    if (db.stocks[kategori].length < 10) return ctx.answerCbQuery('❌ Stok tidak cukup 10.', { show_alert: true });

    const now = Date.now();
    // Cooldown Borong VIP (Role 3) = 5 Menit
    if (user.role === 3) { 
        const cooldown = 5 * 60 * 1000; 
        if (now - user.lastAmbil10 < cooldown) {
            const sisaMnt = Math.ceil((cooldown - (now - user.lastAmbil10)) / 1000 / 60);
            return ctx.answerCbQuery(`⏳ Cooldown! Tunggu ${sisaMnt} menit lagi.`, { show_alert: true });
        }
        user.lastAmbil10 = now;
    }

    const diambil = db.stocks[kategori].splice(0, 10);
    saveDb();

    ctx.answerCbQuery(`✅ Berhasil memborong 10 akun!`);
    let msgText = `🔥 *BORONG 10 AKUN ${kategori.toUpperCase()}*\n\n`;
    diambil.forEach((akun, i) => {
        msgText += `${i + 1}. \`${akun}\`\n`;
    });
    ctx.reply(msgText, { parse_mode: 'Markdown' });
});

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

// --- ADMIN PANEL ---
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
               `• \`/addstock <kategori> <data>\`\n` +
               `• \`/broadcast <pesan>\``;

    ctx.editMessageText(text, {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
            [Markup.button.callback('📊 Cek Detail User', 'admin_detail_user')],
            [Markup.button.callback('⬅️ Kembali', 'back_to_menu')]
        ])
    });
});

// --- INTEGRASI LOG KE AKSI ---

// Log saat setrole
const originalSetRole = bot.command('setrole', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return;

    const args = ctx.message.text.split(' ');
    if (args.length < 3) return ctx.reply('Format: /setrole <1-4> <id>');
    
    const targetId = args[2];
    const newRole = args[1];
    
    // ... (logika setrole kamu yang lama) ...
    
    await sendLog(ctx, `Mengubah Role User \`${targetId}\` menjadi *${getRoleName(parseInt(newRole))}*`);
    ctx.reply(`✅ Sukses mengubah role ${targetId}`);
});

// Log saat addstock
bot.command('addstock', async (ctx) => {
    const userId = ctx.from.id.toString();
    if (db.users[userId].role !== 4) return;

    const args = ctx.message.text.split(' ');
    const kategori = args[1];
    
    // ... (logika addstock kamu yang lama) ...
    
    await sendLog(ctx, `Menambahkan stok ke kategori *${kategori}*`);
    ctx.reply(`✅ Stok ${kategori} ditambahkan.`);
});

// Log saat User Ambil Akun
// Tambahkan sendLog di dalam action take1 dan take10
// Contoh di take1:
bot.action(/^take1_(.+)$/, async (ctx) => {
    const kategori = ctx.match[1];
    // ... (logika ambil akun kamu) ...

    const diambil = db.stocks[kategori].shift(); 
    saveDb();

    // KIRIM LOG
    await sendLog(ctx, `Mengambil 1 akun *${kategori.toUpperCase()}*`);
    
    ctx.reply(`✅ *DATA AKUN ${kategori.toUpperCase()}*\n\n\`${diambil}\``, { parse_mode: 'Markdown' });
});

// Broadcast Message (Hanya Owner)
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
        } catch (e) { /* skip if blocked */ }
    }

    ctx.reply(`✅ Broadcast terkirim ke ${success} user.`);
    await sendLog(ctx, `Mengirim broadcast ke ${success} user.`);
});

// Jalankan Bot
bot.launch().then(() => console.log('Bot berhasil dijalankan!'));

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
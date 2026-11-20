import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Activity, ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, BarChart3,
  Bell, Boxes, Check, CheckCircle2, ChevronDown, ChevronLeft, ChevronRight,
  CircleHelp, Clock3, CloudUpload, Download, FileSpreadsheet, Filter,
  Home, LayoutDashboard, LogOut, Menu, MoreHorizontal, Package, Plus,
  Search, Settings2, ShieldCheck, SlidersHorizontal, Sparkles, Tag,
  TrendingDown, TrendingUp, Upload, UserRound, Users, X, ScanBarcode,
  AlertTriangle, Minus, Trash2, RefreshCw, FileUp, FileDown, Sun, Moon
} from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'

const seed = [
  ['A0101','ARLOJI DC KALEP','ACC',85000,1],['A0102','ARLOJI ADIDAS','ACC',90000,1],
  ['A0115','JAM TANGAN KOTAK','ACC',65000,2],['B0122','BANDO POLOS','ACC',3000,6],
  ['B01142','BANDO POLOS','ACC',28000,2],['B01137','BANDO PITA','ACC',8000,0],
  ['B0156','BANDO PITA','ACC',8000,6],['C0103','CERMIN SISIR 28','ACC',12000,5],
  ['G01224','GANCI SWEET','ACC',7000,1],['G01106','GANCI PITA','ACC',28000,2],
  ['G0140','GANCI SANRIO RIBBON','ACC',9000,3],['J0105','JEPIT RAMBUT MINI','ACC',2500,20],
  ['K0101','KALUNG LOVE','ACC',15000,4],['N0109','NOTES KARAKTER MIX','ATK',6000,9],
  ['P04102','CINCIN BUNGA LOVE','ACC',5000,1],['S0301','SISIR MINI DOUBLE','ACC',4000,24],
  ['S0302','SISIR SERIT BESI','ACC',5000,9],['T0101','TISU POCKET','ATK',1500,303],
  ['A0312','1 SET KOTAK MAKAN 8500','MKN',43000,2],['L0101','LIP TINT PEACH','MAKE UP',14000,7]
].map(([code,name,type,cost,stock]) => ({ code,name,type,cost,stock,price:0,brand:'NO MERK' }))

const initialHistory = [
  { id: 2, type:'Penyesuaian', by:'Dewi', shift:'Siang', date:'19 Nov 2026', status:'Terkirim', rows:[{code:'A0104',name:'ARLOJI MAUVRE HITAM',qty:2}] },
  { id: 1, type:'Restock', by:'Rina', shift:'Pagi', date:'19 Nov 2026', status:'Sudah di-import', rows:[{code:'G01224',name:'GANCI SWEET',qty:6}] }
]
const money = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n)||0)
const dateLabel = () => new Intl.DateTimeFormat('id-ID',{day:'2-digit',month:'short',year:'numeric'}).format(new Date())
const load = (key,fallback) => { try { const x=localStorage.getItem(key); return x?JSON.parse(x):fallback } catch { return fallback } }
const exportRows = items => items.map(i => ({KODEITEM:i.code,NAMAITEM:i.name,JENIS:i.type,HARGAPOKOK1:i.cost,STOKAWAL:i.stock,MEREK:i.brand||'NO MERK',HARGAJUAL:i.price||0}))

function App(){
  const [user,setUser] = useState(() => load('sp-user',null))
  const [items,setItems] = useState(() => load('sp-items',seed))
  const [history,setHistory] = useState(() => load('sp-history',initialHistory))
  const [batch,setBatch] = useState([])
  const [page,setPage] = useState('overview')
  const [query,setQuery] = useState('')
  const [category,setCategory] = useState('Semua')
  const [modal,setModal] = useState('')
  const [toast,setToast] = useState('')
  const [role,setRole] = useState('Karyawan')
  const [shift,setShift] = useState('Pagi')
  const [name,setName] = useState('Rina')
  const [importPreview,setImportPreview] = useState(null)
  const [dark,setDark] = useState(false)
  const [mobileNav,setMobileNav] = useState(false)
  const [form,setForm] = useState({name:'',type:'ACC',cost:'',price:'',qty:1,brand:'NO MERK',group:'A01'})
  const fileRef = useRef(null)
  const [historyFilter,setHistoryFilter] = useState('Semua')

  useEffect(()=>localStorage.setItem('sp-items',JSON.stringify(items)),[items])
  useEffect(()=>localStorage.setItem('sp-history',JSON.stringify(history)),[history])
  useEffect(()=>{ if(user) localStorage.setItem('sp-user',JSON.stringify(user)); else localStorage.removeItem('sp-user') },[user])
  useEffect(()=>{ if(toast){const t=setTimeout(()=>setToast(''),3000);return ()=>clearTimeout(t)} },[toast])

  const isAdmin = user?.role === 'Admin'
  const categories = ['Semua',...new Set(items.map(x=>x.type))]
  const filtered = useMemo(()=>items.filter(i=>(category==='Semua'||i.type===category)&&(`${i.code} ${i.name} ${i.type}`).toLowerCase().includes(query.toLowerCase())),[items,category,query])
  const lowStock = items.filter(i=>i.stock<=2).length
  const totalUnits = items.reduce((a,b)=>a+(Number(b.stock)||0),0)
  const stockValue = items.reduce((a,b)=>a+(Number(b.stock)||0)*(Number(b.cost)||0),0)
  const notify = msg => setToast(msg)
  const go = p => {setPage(p);setMobileNav(false);setQuery('')}
  const addToBatch = (item,qty=1,isNew=false) => {
    setBatch(old=>{const found=old.find(x=>x.code===item.code);return found?old.map(x=>x.code===item.code?{...x,qty:x.qty+qty}:x):[...old,{...item,qty,isNew}]})
    notify('Barang ditambahkan ke batch')
  }
  const nextCode = group => {
    const nums=items.filter(i=>i.code.startsWith(group)).map(i=>Number(i.code.slice(3))||0)
    return group+String(Math.max(0,...nums)+1).padStart(2,'0')
  }
  const saveNew = e => {
    e.preventDefault()
    if(!form.name.trim()) return notify('Nama barang wajib diisi')
    const item={code:nextCode(form.group),name:form.name.trim().toUpperCase(),type:form.type,cost:+form.cost||0,price:+form.price||0,stock:0,brand:form.brand}
    setItems(old=>[...old,item]);addToBatch(item,+form.qty||1,true);setForm({name:'',type:'ACC',cost:'',price:'',qty:1,brand:'NO MERK',group:'A01'});go('batch')
  }
  const submitBatch = () => {
    if(!batch.length) return
    const entry={id:Date.now(),type:'Restock',by:user.name,shift:user.shift,date:dateLabel(),status:'Terkirim',rows:batch.map(x=>({code:x.code,name:x.name,qty:x.qty}))}
    setHistory(old=>[entry,...old]);setBatch([]);notify('Batch tersimpan di riwayat')
  }
  const downloadBlob = (blob,filename) => {
    const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;a.click();URL.revokeObjectURL(url)
  }
  const exportCSV = (rows=items) => {
    const csv=Papa.unparse(exportRows(rows));downloadBlob(new Blob(['\ufeff'+csv],{type:'text/csv;charset=utf-8;'}),`stock-plus-${Date.now()}.csv`);notify('File CSV berhasil diekspor')
  }
  const exportExcel = (rows=items) => {
    const ws=XLSX.utils.json_to_sheet(exportRows(rows));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'Data Barang');XLSX.writeFile(wb,`stock-plus-${Date.now()}.xlsx`);notify('File Excel berhasil diekspor')
  }
  const parseImport = file => {
    if(!file) return
    const ext=file.name.split('.').pop().toLowerCase()
    const process = rows => {
      const normalized=rows.map(row=>{
        const r={};Object.entries(row||{}).forEach(([k,v])=>r[String(k).trim().toUpperCase().replace(/\s/g,'')]=v)
        const code=r.KODEITEM??r.KODE??r.CODE
        if(!code) return null
        return {code:String(code).trim(),name:String(r.NAMAITEM??r.NAMA??r.NAME??code).trim().toUpperCase(),type:String(r.JENIS??r.TYPE??'ACC').trim().toUpperCase(),cost:Number(r.HARGAPOKOK1??r.HARGAPOKOK??r.COST??0)||0,stock:Number(r.STOKAWAL??r.STOK??r.STOCK??0)||0,price:Number(r.HARGAJUAL??r.PRICE??0)||0,brand:String(r.MEREK??r.BRAND??'NO MERK')}
      }).filter(Boolean)
      if(!normalized.length){notify('Tidak menemukan data dengan kolom KODEITEM');return}
      const existing=new Set(items.map(x=>x.code.toUpperCase()))
      const update=normalized.filter(x=>existing.has(x.code.toUpperCase())).length
      const fresh=normalized.filter(x=>!existing.has(x.code.toUpperCase()))
      setImportPreview({rows:normalized,update,fresh:fresh.length,filename:file.name})
    }
    if(ext==='csv'||ext==='txt') Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>process(r.data),error:()=>notify('File CSV tidak dapat dibaca')})
    else if(ext==='xlsx'||ext==='xls'){const reader=new FileReader();reader.onload=e=>{try{const wb=XLSX.read(e.target.result,{type:'array'});process(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]],{defval:''}))}catch{notify('File Excel tidak dapat dibaca')}};reader.readAsArrayBuffer(file)}
    else notify('Format didukung: CSV, XLS, XLSX')
  }
  const commitImport = () => {
    if(!importPreview)return
    setItems(old=>{
      const map=new Map(old.map(x=>[x.code.toUpperCase(),x]))
      importPreview.rows.forEach(x=>map.set(x.code.toUpperCase(),{...map.get(x.code.toUpperCase()),...x}))
      return [...map.values()]
    })
    notify(`${importPreview.rows.length} baris berhasil diproses`);setImportPreview(null);setModal('')
  }
  const markImported = id => {setHistory(old=>old.map(h=>h.id===id?{...h,status:'Sudah di-import'}:h));notify('Status diperbarui')}
  const login = e => {e.preventDefault();setUser({name:name.trim()||'Pengguna',role,shift});go('overview')}
  const navItems = [
    {id:'overview',label:'Overview',icon:LayoutDashboard,group:'WORKSPACE'},
    {id:'inventory',label:'Inventaris',icon:Package},
    {id:'batch',label:'Batch & barcode',icon:Boxes,badge:batch.length||null},
    {id:'adjustment',label:'Penyesuaian stok',icon:ArrowLeftRight},
    {id:'history',label:'Riwayat aktivitas',icon:Clock3},
    {id:'transfer',label:'Import & export',icon:FileSpreadsheet,group:'TOOLS'},
    ...(isAdmin?[{id:'admin',label:'Pengaturan admin',icon:Settings2,group:'ADMIN'}]:[])
  ]
  const pageTitle=({overview:'Overview',inventory:'Inventaris barang',batch:'Batch & barcode',adjustment:'Penyesuaian stok',history:'Riwayat aktivitas',transfer:'Import & export',admin:'Pengaturan admin',new:'Tambah barang'})[page]||'Stock Plus'

  if(!user) return <div className="login-shell"><div className="login-art"><div className="brand"><span className="brand-mark">S<span>+</span></span><span>STOCK<span className="brand-light">PLUS</span></span></div><div className="art-copy"><div className="eyebrow"><Sparkles size={14}/> INVENTORY, REIMAGINED</div><h1>Semua stok,<br/><em>satu kendali.</em></h1><p>Ruang kerja inventaris yang rapi untuk tim yang bergerak cepat.</p><div className="art-stats"><div><b>01</b><span>Terorganisir</span></div><div><b>02</b><span>Terukur</span></div><div><b>03</b><span>Terhubung</span></div></div></div><div className="art-footer">STOCK PLUS WORKSPACE <span>© 2026</span></div></div><div className="login-panel"><form className="login-form" onSubmit={login}><div className="mobile-brand"><span className="brand-mark">S<span>+</span></span> STOCK PLUS</div><div className="eyebrow muted">SELAMAT DATANG KEMBALI</div><h2>Masuk ke workspace</h2><p className="subtle">Gunakan profil untuk membuka dashboard inventaris.</p><label>Nama pengguna</label><div className="input-icon"><UserRound size={17}/><input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu"/></div><label>Peran akses</label><div className="role-switch"><button type="button" className={role==='Karyawan'?'selected':''} onClick={()=>setRole('Karyawan')}><Users size={16}/> Karyawan</button><button type="button" className={role==='Admin'?'selected':''} onClick={()=>setRole('Admin')}><ShieldCheck size={16}/> Admin</button></div><label>Shift kerja</label><div className="role-switch"><button type="button" className={shift==='Pagi'?'selected':''} onClick={()=>setShift('Pagi')}>Shift pagi</button><button type="button" className={shift==='Siang'?'selected':''} onClick={()=>setShift('Siang')}>Shift siang</button></div><button className="primary-btn login-btn">Masuk ke Stock Plus <ChevronRight size={18}/></button><div className="login-note"><ShieldCheck size={15}/> Demo UI · autentikasi backend belum diaktifkan</div></form></div></div>

  return <div className={`app-shell ${dark?'dark':''}`}>
    <aside className={`sidebar ${mobileNav?'mobile-open':''}`}><div className="brand sidebar-brand"><span className="brand-mark">S<span>+</span></span><span>STOCK<span className="brand-light">PLUS</span><small>INVENTORY WORKSPACE</small></span><button className="mobile-close icon-btn" onClick={()=>setMobileNav(false)}><X/></button></div><div className="workspace-switch"><div className="workspace-icon">D</div><div><b>Daizy Store</b><small>Workspace utama</small></div><ChevronDown size={15}/></div><nav className="side-nav">{navItems.map((n,i)=><div key={n.id}>{n.group&&<div className="nav-group">{n.group}</div>}<button className={`nav-link ${page===n.id?'active':''}`} onClick={()=>go(n.id)}><n.icon size={18}/><span>{n.label}</span>{n.badge?<b className="nav-badge">{n.badge}</b>:null}</button></div>)}</nav><div className="sidebar-bottom"><div className="help-card"><div className="help-icon"><CircleHelp size={17}/></div><b>Butuh bantuan?</b><p>Panduan singkat penggunaan Stock Plus.</p><button onClick={()=>notify('Panduan penggunaan segera tersedia')}>Lihat panduan <ChevronRight size={14}/></button></div><div className="profile-mini"><div className="avatar">{user.name.slice(0,1).toUpperCase()}</div><div className="profile-meta"><b>{user.name}</b><small>{user.role} · Shift {user.shift}</small></div><button className="icon-btn" title="Keluar" onClick={()=>setUser(null)}><LogOut size={17}/></button></div></div></aside>
    {mobileNav&&<div className="mobile-scrim" onClick={()=>setMobileNav(false)}/>}
    <main className="main-area"><header className="topbar"><div className="top-left"><button className="icon-btn mobile-menu" onClick={()=>setMobileNav(true)}><Menu/></button><div className="breadcrumbs">Workspace <ChevronRight size={14}/> <b>{pageTitle}</b></div></div><div className="top-actions"><div className="today-pill"><span className="live-dot"/>{dateLabel()}</div><button className="icon-btn" onClick={()=>setDark(!dark)} title="Ganti tema">{dark?<Sun size={18}/>:<Moon size={18}/>}</button><button className="icon-btn notification" onClick={()=>notify('Tidak ada notifikasi baru')}><Bell size={18}/><i/></button><div className="top-avatar">{user.name.slice(0,1).toUpperCase()}</div></div></header>
    <div className="content-wrap"><div className="page-heading"><div><div className="eyebrow muted">{page==='overview'?'RINGKASAN TOKO':'STOCK PLUS / '+page.toUpperCase()}</div><h1>{pageTitle}<span className="heading-period">{page==='overview'?' / Hari ini':''}</span></h1><p className="subtle">{page==='overview'?'Pantau kondisi inventaris dan aktivitas operasional toko.':page==='inventory'?'Kelola katalog, pantau stok, dan temukan barang dengan cepat.':page==='transfer'?'Kelola data inventaris dengan import dan export file.':'Kelola aktivitas inventaris dalam satu tempat.'}</p></div><div className="heading-actions">{page==='overview'&&<button className="outline-btn" onClick={()=>go('transfer')}><ArrowDownToLine size={16}/> Import / Export</button>}<button className="primary-btn" onClick={()=>go('new')}><Plus size={17}/> Barang baru</button></div></div>

    {page==='overview'&&<><div className="welcome-banner"><div className="welcome-text"><div className="eyebrow"><Sparkles size={13}/> YOUR STORE AT A GLANCE</div><h2>Halo, {user.name.split(' ')[0]} <span>✳</span></h2><p>Ini ringkasan inventaris tokomu. Yuk, pastikan semua tetap terkendali.</p><button onClick={()=>go('inventory')}>Lihat inventaris <ArrowUpFromLine size={15}/></button></div><div className="banner-graphic"><div className="graphic-ring ring-one"/><div className="graphic-ring ring-two"/><div className="graphic-box"><Package size={54}/><span>STOCK<br/>IN SYNC</span></div><div className="float-tag tag-a"><TrendingUp size={14}/> LIVE INVENTORY</div><div className="float-tag tag-b">S+ <span>WORKSPACE</span></div></div></div>
    <div className="stats-grid"><div className="stat-card"><div className="stat-top"><span>Total SKU</span><div className="stat-icon violet"><Package size={18}/></div></div><div className="stat-value">{items.length.toLocaleString('id-ID')}<small> item</small></div><div className="stat-foot"><span className="positive"><TrendingUp size={13}/> Katalog aktif</span><span>Seluruh kategori</span></div></div><div className="stat-card"><div className="stat-top"><span>Total unit stok</span><div className="stat-icon amber"><Boxes size={18}/></div></div><div className="stat-value">{totalUnits.toLocaleString('id-ID')}<small> pcs</small></div><div className="stat-foot"><span className="neutral"><Activity size={13}/> Stok tercatat</span><span>Semua lokasi</span></div></div><div className="stat-card"><div className="stat-top"><span>Perlu perhatian</span><div className="stat-icon red"><AlertTriangle size={18}/></div></div><div className="stat-value">{lowStock}<small> item</small></div><div className="stat-foot"><span className="negative"><TrendingDown size={13}/> Stok ≤ 2</span><span>Perlu dicek</span></div></div><div className="stat-card"><div className="stat-top"><span>Nilai persediaan</span><div className="stat-icon green"><BarChart3 size={18}/></div></div><div className="stat-value compact">{money(stockValue)}</div><div className="stat-foot"><span className="positive"><CheckCircle2 size={13}/> Berdasarkan HPP</span><span>Estimasi nilai</span></div></div></div>
    <div className="dashboard-grid"><section className="panel inventory-panel"><div className="panel-heading"><div><h3>Stok perlu perhatian</h3><p>Barang dengan jumlah stok rendah</p></div><button className="text-btn" onClick={()=>{setCategory('Semua');go('inventory')}}>Lihat semua <ChevronRight size={15}/></button></div><div className="table-wrap"><table><thead><tr><th>PRODUK</th><th>KATEGORI</th><th>HPP</th><th>STOK</th><th>STATUS</th></tr></thead><tbody>{items.filter(x=>x.stock<=2).slice(0,5).map(i=><tr key={i.code}><td><div className="product-cell"><div className="product-thumb"><Package size={17}/></div><div><b>{i.name}</b><small>{i.code}</small></div></div></td><td><span className="category-tag">{i.type}</span></td><td>{money(i.cost)}</td><td><b>{i.stock}</b></td><td><span className={`status ${i.stock===0?'danger':'warning'}`}><i/>{i.stock===0?'Habis':'Menipis'}</span></td></tr>)}</tbody></table></div></section><section className="panel activity-panel"><div className="panel-heading"><div><h3>Aktivitas terbaru</h3><p>Pergerakan inventaris terkini</p></div><button className="icon-btn" onClick={()=>go('history')}><MoreHorizontal size={19}/></button></div><div className="activity-list">{history.slice(0,4).map((h,i)=><div className="activity-item" key={h.id}><div className={`activity-symbol ${i%2?'yellow':'purple'}`}>{h.type==='Restock'?<ArrowDownToLine size={16}/>:<ArrowLeftRight size={16}/>}</div><div className="activity-copy"><b>{h.type} #{String(h.id).slice(-4)}</b><span>{h.by} · {h.shift} · {h.rows.length} barang</span></div><div className="activity-time">{h.date}</div></div>)}{!history.length&&<p className="empty-state">Belum ada aktivitas.</p>}</div><button className="activity-link" onClick={()=>go('history')}>Lihat seluruh aktivitas <ArrowUpFromLine size={14}/></button></section></div></>}

    {page==='inventory'&&<section className="panel page-panel"><div className="toolbar"><div className="search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari nama barang atau kode..."/>{query&&<button onClick={()=>setQuery('')}><X size={15}/></button>}</div><div className="toolbar-right"><select className="select-control" value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select><button className="outline-btn" onClick={()=>go('transfer')}><ArrowDownToLine size={16}/> Import / Export</button></div></div><div className="table-wrap"><table className="inventory-table"><thead><tr><th>PRODUK</th><th>KODE ITEM</th><th>KATEGORI</th><th>HARGA POKOK</th><th>STOK</th><th>STATUS</th><th></th></tr></thead><tbody>{filtered.map(i=><tr key={i.code}><td><div className="product-cell"><div className="product-thumb"><Package size={17}/></div><div><b>{i.name}</b><small>{i.brand||'NO MERK'}</small></div></div></td><td className="mono">{i.code}</td><td><span className="category-tag">{i.type}</span></td><td>{money(i.cost)}</td><td><b>{i.stock}</b> <span className="subtle">pcs</span></td><td><span className={`status ${i.stock===0?'danger':i.stock<=2?'warning':'good'}`}><i/>{i.stock===0?'Habis':i.stock<=2?'Menipis':'Aman'}</span></td><td><button className="small-action" onClick={()=>addToBatch(i)} title="Tambah ke batch"><Plus size={16}/></button></td></tr>)}</tbody></table>{!filtered.length&&<div className="empty-state">Barang tidak ditemukan.</div>}</div><div className="table-footer"><span>Menampilkan <b>{filtered.length}</b> dari <b>{items.length}</b> barang</span><span className="subtle">Data tersimpan di perangkat ini</span></div></section>}

    {page==='batch'&&<div className="two-column"><section className="panel page-panel"><div className="panel-heading"><div><h3>Daftar batch</h3><p>Barang yang akan diproses sebagai restock</p></div><span className="count-pill">{batch.length} item</span></div>{batch.length?<div className="batch-list">{batch.map(b=><div className="batch-row" key={b.code}><div className="product-thumb"><Package size={18}/></div><div className="batch-product"><b>{b.name}</b><small className="mono">{b.code} · {b.type} {b.isNew&&<em className="new-tag">BARU</em>}</small></div><div className="qty-control"><button onClick={()=>setBatch(old=>old.map(x=>x.code===b.code?{...x,qty:Math.max(1,x.qty-1)}:x))}><Minus size={14}/></button><b>{b.qty}</b><button onClick={()=>setBatch(old=>old.map(x=>x.code===b.code?{...x,qty:x.qty+1}:x))}><Plus size={14}/></button></div><button className="icon-btn danger-icon" onClick={()=>setBatch(old=>old.filter(x=>x.code!==b.code))}><Trash2 size={16}/></button></div>)}</div>:<div className="empty-large"><div><Boxes size={28}/></div><h3>Batch masih kosong</h3><p>Tambahkan barang dari halaman inventaris untuk mulai membuat batch restock.</p><button className="primary-btn" onClick={()=>go('inventory')}><Plus size={16}/> Pilih barang</button></div>}</section><section className="panel batch-summary"><div className="summary-icon"><FileSpreadsheet size={21}/></div><h3>Ringkasan batch</h3><p>Periksa kembali jumlah barang sebelum menyelesaikan batch.</p><div className="summary-line"><span>Jumlah jenis barang</span><b>{batch.length}</b></div><div className="summary-line"><span>Total unit</span><b>{batch.reduce((a,b)=>a+b.qty,0)} pcs</b></div><div className="summary-line"><span>Estimasi nilai HPP</span><b>{money(batch.reduce((a,b)=>a+b.qty*b.cost,0))}</b></div><button className="primary-btn full-btn" disabled={!batch.length} onClick={submitBatch}><Check size={17}/> Simpan batch</button><button className="outline-btn full-btn" disabled={!batch.length} onClick={()=>exportExcel(batch.map(b=>({...b,stock:b.qty})))}><Download size={16}/> Export batch Excel</button><small className="subtle">Menyimpan batch akan menambahkannya ke riwayat aktivitas.</small></section></div>}

    {page==='new'&&<section className="panel form-panel"><div className="form-intro"><div className="form-icon"><Tag size={21}/></div><div><h3>Informasi barang</h3><p>Lengkapi detail barang. Kode item dibuat otomatis.</p></div></div><form onSubmit={saveNew} className="product-form"><div className="form-grid"><div className="field full"><label>Nama barang *</label><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Contoh: GANCI KUCING"/></div><div className="field"><label>Kelompok kode</label><select value={form.group} onChange={e=>setForm({...form,group:e.target.value})}>{[...new Set(items.map(i=>i.code.slice(0,3)))].sort().map(g=><option key={g}>{g}</option>)}</select></div><div className="field"><label>Kode item berikutnya</label><div className="generated-code">{nextCode(form.group)} <ScanBarcode size={17}/></div></div><div className="field"><label>Kategori</label><select value={form.type} onChange={e=>setForm({...form,type:e.target.value})}>{['ACC','ATK','MAKE UP','MKN'].map(t=><option key={t}>{t}</option>)}</select></div><div className="field"><label>Merek</label><select value={form.brand} onChange={e=>setForm({...form,brand:e.target.value})}>{['NO MERK','SANRIO','LASIKA','SYB'].map(t=><option key={t}>{t}</option>)}</select></div><div className="field"><label>Harga pokok (HPP)</label><div className="currency-input"><span>Rp</span><input type="number" min="0" value={form.cost} onChange={e=>setForm({...form,cost:e.target.value})} placeholder="0"/></div></div><div className="field"><label>Harga jual</label><div className="currency-input"><span>Rp</span><input type="number" min="0" value={form.price} onChange={e=>setForm({...form,price:e.target.value})} placeholder="0"/></div></div><div className="field"><label>Jumlah awal / restock</label><input type="number" min="1" value={form.qty} onChange={e=>setForm({...form,qty:e.target.value})}/></div></div><div className="form-actions"><button type="button" className="outline-btn" onClick={()=>go('inventory')}>Batal</button><button className="primary-btn"><Plus size={16}/> Simpan & tambah ke batch</button></div></form></section>}

    {page==='adjustment'&&<Adjustment items={items} setHistory={setHistory} user={user} notify={notify}/>}
    {page==='history'&&<section className="panel page-panel"><div className="toolbar"><div><h3>Semua aktivitas</h3><p className="subtle">Catatan batch dan penyesuaian stok</p></div><select className="select-control" value={historyFilter} onChange={e=>setHistoryFilter(e.target.value)}>{['Semua','Restock','Penyesuaian'].map(x=><option>{x}</option>)}</select></div><div className="history-list">{history.filter(h=>historyFilter==='Semua'||h.type===historyFilter).map(h=><div className="history-card"><div className="history-type-icon">{h.type==='Restock'?<ArrowDownToLine size={19}/>:<ArrowLeftRight size={19}/>}</div><div className="history-main"><div className="history-title"><b>{h.type} #{String(h.id).slice(-5)}</b><span className={`status ${h.status==='Sudah di-import'?'good':'warning'}`}><i/>{h.status}</span></div><p>{h.date} · {h.by} · Shift {h.shift}</p><div className="history-products">{h.rows.map(r=><span>{r.name} <b>×{r.qty}</b></span>)}</div></div><div className="history-actions">{h.status==='Terkirim'&&<button className="outline-btn compact-btn" onClick={()=>markImported(h.id)}>Tandai di-import</button>}<button className="icon-btn" onClick={()=>setModal('history-'+h.id)}><MoreHorizontal size={18}/></button></div>{modal==='history-'+h.id&&<div className="history-detail"><b>Detail transaksi</b>{h.rows.map(r=><p>{r.code} · {r.name} · {r.qty} pcs</p>)}<button className="text-btn" onClick={()=>setModal('')}>Tutup</button></div>}</div>)}{!history.length&&<div className="empty-state">Belum ada riwayat aktivitas.</div>}</div></section>}

    {page==='transfer'&&<div className="transfer-layout"><section className="panel transfer-card"><div className="transfer-icon import"><Upload size={22}/></div><div className="eyebrow muted">INPUT DATA</div><h3>Import data inventaris</h3><p>Unggah file CSV atau Excel untuk menambahkan barang baru maupun memperbarui data yang sudah ada.</p><div className="format-row"><span><FileSpreadsheet size={15}/> .CSV</span><span><FileSpreadsheet size={15}/> .XLSX</span><span><FileSpreadsheet size={15}/> .XLS</span></div><input ref={fileRef} type="file" accept=".csv,.txt,.xlsx,.xls" hidden onChange={e=>parseImport(e.target.files?.[0])}/><button className="primary-btn full-btn" onClick={()=>fileRef.current?.click()}><FileUp size={17}/> Pilih file untuk import</button><small className="subtle">Kolom utama: KODEITEM, NAMAITEM, JENIS, HARGAPOKOK1, STOKAWAL</small></section><section className="panel transfer-card"><div className="transfer-icon export"><Download size={22}/></div><div className="eyebrow muted">OUTPUT DATA</div><h3>Export data inventaris</h3><p>Unduh data inventaris untuk backup, laporan, atau diproses lebih lanjut di Excel.</p><div className="export-info"><div><span>Total barang</span><b>{items.length} SKU</b></div><div><span>Total stok</span><b>{totalUnits} pcs</b></div></div><button className="outline-btn full-btn" onClick={()=>exportCSV()}><Download size={16}/> Export sebagai CSV</button><button className="primary-btn full-btn" onClick={()=>exportExcel()}><FileSpreadsheet size={16}/> Export sebagai Excel</button></section><section className="panel transfer-note"><div className="note-icon"><ShieldCheck size={19}/></div><div><b>Import & export tersedia untuk semua role</b><p>Fitur ini dapat digunakan oleh karyawan maupun admin. Pengaturan administratif tetap dibatasi sesuai role pengguna.</p></div></section></div>}

    {page==='admin'&&<section className="panel page-panel"><div className="panel-heading"><div><h3>Pengaturan workspace</h3><p>Area khusus administrator</p></div><span className="admin-tag"><ShieldCheck size={14}/> ADMIN</span></div><div className="admin-settings"><div><div className="settings-icon"><Users size={19}/></div><div><b>Role & akses</b><p>Karyawan dapat mengelola inventaris dan menggunakan import/export. Pengaturan workspace hanya untuk admin.</p></div></div><div><div className="settings-icon"><FileSpreadsheet size={19}/></div><div><b>Format data</b><p>Format import/export yang didukung: CSV, XLS, XLSX.</p></div></div><div><div className="settings-icon"><CloudUpload size={19}/></div><div><b>Integrasi penyimpanan</b><p>Integrasi Google Drive membutuhkan konfigurasi OAuth dan backend.</p></div></div></div></section>}
    </div><footer className="app-footer"><span>© 2026 Stock Plus</span><span>MADE FOR BETTER INVENTORY <span className="footer-star">✳</span></span></footer></main>
    {toast&&<div className="toast"><CheckCircle2 size={17}/>{toast}</div>}
    {importPreview&&<div className="modal-backdrop" onClick={()=>setImportPreview(null)}><div className="modal-card" onClick={e=>e.stopPropagation()}><button className="modal-close icon-btn" onClick={()=>setImportPreview(null)}><X/></button><div className="modal-icon"><FileSpreadsheet size={22}/></div><div className="eyebrow muted">IMPORT PREVIEW</div><h2>Periksa data sebelum disimpan</h2><p className="subtle">File: {importPreview.filename}</p><div className="preview-stats"><div><b>{importPreview.rows.length}</b><span>Total baris</span></div><div><b>{importPreview.fresh}</b><span>Barang baru</span></div><div><b>{importPreview.update}</b><span>Diperbarui</span></div></div><div className="preview-table"><table><thead><tr><th>KODE</th><th>NAMA BARANG</th><th>STOK</th></tr></thead><tbody>{importPreview.rows.slice(0,5).map(r=><tr><td className="mono">{r.code}</td><td>{r.name}</td><td>{r.stock}</td></tr>)}</tbody></table>{importPreview.rows.length>5&&<small>dan {importPreview.rows.length-5} baris lainnya...</small>}</div><div className="modal-actions"><button className="outline-btn" onClick={()=>setImportPreview(null)}>Batal</button><button className="primary-btn" onClick={commitImport}><Check size={16}/> Terapkan import</button></div></div></div>}
  </div>
}

function Adjustment({items,setHistory,user,notify}){
  const [q,setQ]=useState('');const [selected,setSelected]=useState(null);const [physical,setPhysical]=useState('');const [reason,setReason]=useState('Stok display belum tercatat')
  const matches=items.filter(i=>(i.name+' '+i.code).toLowerCase().includes(q.toLowerCase())).slice(0,8)
  const submit=e=>{e.preventDefault();if(physical==='')return notify('Isi jumlah fisik terlebih dahulu');const entry={id:Date.now(),type:'Penyesuaian',by:user.name,shift:user.shift,date:dateLabel(),status:'Terkirim',rows:[{code:selected.code,name:selected.name,qty:Number(physical),system:selected.stock,reason}]};setHistory(old=>[entry,...old]);setSelected(null);setPhysical('');setQ('');notify('Penyesuaian berhasil dicatat')}
  return <div className="two-column"><section className="panel page-panel"><div className="panel-heading"><div><h3>Pilih barang</h3><p>Cari barang yang ingin disesuaikan</p></div></div><div className="search-box wide-search"><Search size={17}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Cari nama atau kode barang..."/></div>{q&&<div className="picker-results">{matches.map(i=><button onClick={()=>{setSelected(i);setQ('')}}><div className="product-thumb"><Package size={17}/></div><div><b>{i.name}</b><small>{i.code} · Stok data: {i.stock}</small></div><ChevronRight size={16}/></button>)}</div>}{!q&&!selected&&<div className="empty-large"><div><ArrowLeftRight size={26}/></div><h3>Belum ada barang dipilih</h3><p>Gunakan pencarian untuk memilih barang yang akan disesuaikan.</p></div>}{selected&&<form className="adjust-form" onSubmit={submit}><div className="selected-product"><div className="product-thumb"><Package size={18}/></div><div><b>{selected.name}</b><small>{selected.code} · {selected.type}</small></div><button type="button" className="icon-btn" onClick={()=>setSelected(null)}><X size={17}/></button></div><label>Jumlah fisik di rak</label><input type="number" min="0" value={physical} onChange={e=>setPhysical(e.target.value)} placeholder="Masukkan jumlah aktual"/><div className="difference"><span>Selisih dari stok sistem</span><b>{physical===''?'—':Number(physical)-selected.stock>0?'+':''}{physical===''?'':Number(physical)-selected.stock}</b></div><label>Alasan penyesuaian</label><select value={reason} onChange={e=>setReason(e.target.value)}><option>Stok display belum tercatat</option><option>Salah input</option><option>Barang rusak</option><option>Hasil stock opname</option></select><button className="primary-btn full-btn"><Check size={16}/> Simpan penyesuaian</button></form>}</section><section className="panel batch-summary"><div className="summary-icon"><ArrowLeftRight size={21}/></div><h3>Catatan penyesuaian</h3><p>Penyesuaian akan masuk ke riwayat aktivitas agar dapat ditinjau kembali.</p><div className="summary-line"><span>Pengguna</span><b>{user.name}</b></div><div className="summary-line"><span>Role</span><b>{user.role}</b></div><div className="summary-line"><span>Shift</span><b>{user.shift}</b></div><div className="permission-note"><ShieldCheck size={16}/> Aktivitas tercatat atas nama pengguna yang sedang masuk.</div></section></div>
}

export default App

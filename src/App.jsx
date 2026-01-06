import React, { useState, useEffect } from 'react';
import { Page, Toolbar, Card, Button, List, ListItem, Icon, Tabbar, Tab, Dialog, ProgressCircular, ListHeader } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

const styles = `
  .page-container { max-width: 1200px; margin: 0 auto; padding-bottom: 50px; }
  .material-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px; padding: 10px; }
  @media (min-width: 600px) { .material-grid { grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; padding: 20px; } }
  .item-card { margin: 0 !important; cursor: pointer; transition: transform 0.2s; text-align: center; }
  .ons-dialog { max-width: 400px !important; width: 90% !important; border-radius: 12px !important; overflow: hidden; }
  .send-button-container { max-width: 600px; margin: 0 auto; padding: 20px; }
`;

const MATERIALS = [
  { id: 1, name: '支柱', img: 'https://placehold.jp/24/333333/ffffff/150x100.png?text=支柱' },
  { id: 2, name: '手すり', img: 'https://placehold.jp/24/666666/ffffff/150x100.png?text=手すり' },
  { id: 3, name: '先行手すり', img: 'https://placehold.jp/24/999999/ffffff/150x100.png?text=先行手すり' },
  { id: 4, name: 'Sウォーク', img: 'https://placehold.jp/24/0044cc/ffffff/150x100.png?text=Sウォーク' },
];

const MASTER_PASSWORD = "1234"; // GAS側と合わせる
const GAS_URL = "https://script.google.com/macros/s/AKfycbyyW02JJjwpr7-u_MUb8gEHea9q85wNCRm6IBm6mgBD-vyZVUF8ZDNX4pXPqYUTyJxb/exec";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [inputPass, setInputPass] = useState('');
  const [cart, setCart] = useState([]); 
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcDisplay, setCalcDisplay] = useState(''); 
  const [editingIndex, setEditingIndex] = useState(null);

  // 1. 起動時のチェック：保存されているトークン（パスワード）があればログイン状態にする
  useEffect(() => {
    const authData = JSON.parse(localStorage.getItem('scaffold_auth'));
    if (authData) {
      const now = new Date().getTime();
      if (now - authData.loginTime < 3 * 24 * 60 * 60 * 1000) {
        setIsLoggedIn(true);
        fetchHistory(); // 履歴を読み込みにいく（ここでパスワードが違えば弾かれる）
      } else {
        localStorage.removeItem('scaffold_auth');
      }
    }
  }, []);

  // 2. ログイン処理：パスワードの検証はここではせず、保存して画面を切り替えるだけにする
  const handleLogin = () => {
    if (inputPass.length > 0) {
      const authInfo = { 
        loginTime: new Date().getTime(), 
        token: inputPass // 入力された値をトークンとして保存
      };
      localStorage.setItem('scaffold_auth', JSON.stringify(authInfo));
      setIsLoggedIn(true);
      fetchHistory(); // ログイン直後に履歴取得を実行してパスワード検証
    } else {
      alert("パスワードを入力してください");
    }
  };

  // 3. 履歴取得：ここでGASにパスワードを送り、エラーならログイン画面に戻す
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const authData = JSON.parse(localStorage.getItem('scaffold_auth'));
      const pass = authData ? authData.token : "";
      
      const response = await fetch(`${GAS_URL}?auth=${pass}`);
      const data = await response.json();

      // GAS側で認証エラーを返してきた場合
      if (data.result === "error") {
        alert("認証に失敗しました。正しいパスワードを入力してください。");
        localStorage.removeItem('scaffold_auth');
        setIsLoggedIn(false); // ログイン画面へ強制送還
        return;
      }

      // 正常な場合の集計処理
      const summary = data.reduce((acc, obj) => {
        const dateKey = obj.date.split(' ')[0];
        const itemKey = `${obj.name}-${obj.type}`;
        if (!acc[dateKey]) acc[dateKey] = {};
        if (!acc[dateKey][itemKey]) acc[dateKey][itemKey] = { ...obj };
        else acc[dateKey][itemKey].count = Number(acc[dateKey][itemKey].count) + Number(obj.count);
        return acc;
      }, {});
      setHistory(summary);
    } catch (e) {
      console.error(e);
      // 通信エラーなどの場合（GAS側のデプロイミスなど）
    } finally {
      setLoading(false);
    }
  };

  // 4. 送信処理：ここでも保存されているトークン（パスワード）を同封する
  const sendOrder = async () => {
    if (cart.length === 0 || isSending) return;
    setIsSending(true);
    const authData = JSON.parse(localStorage.getItem('scaffold_auth'));
    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ 
          auth: authData?.token, // 保存されているパスワードを送信
          items: cart 
        })
      });
      alert("送信完了！");
      setCart([]);
      fetchHistory();
    } catch (e) { 
      alert("送信エラーが発生しました"); 
    } finally {
      setIsSending(false);
    }
  };

  // ... (以下、UIや電卓の処理などはそのまま)

  const sendOrder = async () => {
    if (cart.length === 0 || isSending) return;
    setIsSending(true);
    const authData = JSON.parse(localStorage.getItem('scaffold_auth'));
    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ auth: authData?.token, items: cart })
      });
      alert("送信完了！");
      setCart([]);
      fetchHistory();
    } catch (e) { alert("送信エラー"); } finally { setIsSending(false); }
  };

  const handleCalcBtn = (val) => {
    if (val === 'C') return setCalcDisplay('');
    if (val === '=') {
      try { setCalcDisplay(Function(`return ${calcDisplay}`)().toString()); } catch (e) { setCalcDisplay('Error'); }
      return;
    }
    setCalcDisplay(prev => prev + val);
  };

  const addToCart = (type) => {
    const finalCount = parseInt(calcDisplay) || 0;
    if (editingIndex !== null) {
      const newCart = [...cart];
      newCart[editingIndex] = { ...selectedItem, count: finalCount, type: type };
      setCart(newCart);
    } else {
      setCart([...cart, { ...selectedItem, count: finalCount, type: type }]);
    }
    closeDialog();
  };

  const closeDialog = () => { setShowDialog(false); setSelectedItem(null); setCalcDisplay(''); setEditingIndex(null); };

  const getTypeColor = (type) => {
    const colors = { '通常': '#555', 'ケレン': '#FF9800', '修理': '#f44336', '完全': '#4CAF50' };
    return colors[type] || '#000';
  };

  // ログインしていない場合の画面
  if (!isLoggedIn) {
    return (
      <Page renderToolbar={() => <Toolbar><div className="center">ログイン</div></Toolbar>}>
        <style>{styles}</style>
        <div style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Icon icon="md-lock" style={{ fontSize: '50px', color: '#00629d', marginBottom: '20px' }} />
          <h3>資材管理システム</h3>
          <input
            type="password"
            placeholder="パスワード"
            value={inputPass}
            onChange={(e) => setInputPass(e.target.value)}
            style={{ width: '100%', padding: '15px', fontSize: '20px', marginBottom: '15px', textAlign: 'center', border:'1px solid #ccc', borderRadius:'8px' }}
          />
          <Button modifier="large" onClick={handleLogin}>ログイン</Button>
        </div>
      </Page>
    );
  }

  // ログイン済みのメイン画面
  return (
    <Page renderToolbar={() => (
      <Toolbar>
        <div className="center">資材管理</div>
        <div className="right">
          <Button modifier="quiet" onClick={() => { localStorage.removeItem('scaffold_auth'); setIsLoggedIn(false); }}>
            <Icon icon="md-sign-in" style={{color:'white'}} />
          </Button>
        </div>
      </Toolbar>
    )}>
      <style>{styles}</style>
      <Tabbar
        position='bottom'
        renderTabs={() => [
          { content: (
            <Page>
              <div className="page-container">
                <div className="material-grid">
                  {MATERIALS.map(item => (
                    <Card key={item.id} className="item-card" onClick={() => { setSelectedItem(item); setShowDialog(true); }}>
                      <img src={item.img} style={{ width: '100%', borderRadius: '8px', aspectRatio: '3/2', objectFit: 'cover' }} />
                      <div style={{ fontWeight: 'bold', padding: '10px' }}>{item.name}</div>
                    </Card>
                  ))}
                </div>
              </div>
            </Page>
          ), tab: <Tab label="選択" icon="md-apps" /> },
          { content: (
            <Page>
              <div className="page-container" style={{ maxWidth: '800px' }}>
                <ListHeader>送信待ちリスト</ListHeader>
                <List>
                  {cart.map((c, i) => (
                    <ListItem key={i} onClick={() => { setSelectedItem(c); setEditingIndex(i); setCalcDisplay(c.count.toString()); setShowDialog(true); }} tappable>
                      <div className="center">
                        <span style={{ fontWeight: 'bold' }}>{c.name}</span>
                        <span style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: getTypeColor(c.type), color: 'white' }}>{c.type}</span>
                      </div>
                      <div className="right" style={{ color: '#0044cc', fontSize: '1.2rem', fontWeight: 'bold' }}>{c.count}</div>
                    </ListItem>
                  ))}
                  {cart.length === 0 && <ListItem>アイテムがありません</ListItem>}
                </List>
                <div className="send-button-container">
                  <Button modifier="large" onClick={sendOrder} disabled={cart.length === 0 || isSending}>
                    {isSending ? <ProgressCircular indeterminate /> : `送信 (${cart.length})`}
                  </Button>
                </div>
              </div>
            </Page>
          ), tab: <Tab label="送信待" icon="md-format-list-bulleted" badge={cart.length > 0 ? cart.length : null} /> },
          { content: (
            <Page>
              <div className="page-container" style={{ maxWidth: '800px' }}>
                <div style={{ textAlign: 'center', padding: '15px' }}>
                  <Button onClick={fetchHistory} modifier="outline" disabled={loading}><Icon icon="md-refresh" /> 更新</Button>
                </div>
                {loading ? <div style={{ textAlign: 'center' }}><ProgressCircular indeterminate /></div> : (
                  Object.keys(history).map(date => (
                    <div key={date}>
                      <ListHeader style={{backgroundColor: '#00629d', color: 'white'}}>{date}</ListHeader>
                      <List>
                        {Object.values(history[date]).map((h, i) => (
                          <ListItem key={i}>
                            <div className="center"><b>{h.name}</b> <small style={{backgroundColor: getTypeColor(h.type), color:'white', padding:'2px 5px', borderRadius:'5px', marginLeft:'5px'}}>{h.type}</small></div>
                            <div className="right"><b>{h.count}</b></div>
                          </ListItem>
                        ))}
                      </List>
                    </div>
                  ))
                )}
              </div>
            </Page>
          ), tab: <Tab label="履歴" icon="md-time-restore" /> }
        ]}
      />
      <Dialog isOpen={showDialog} onCancel={closeDialog} cancelable>
        <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fff' }}>
          <h3>{selectedItem?.name}</h3>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', fontSize: '32px', textAlign: 'right', borderRadius: '5px', marginBottom: '10px' }}>{calcDisplay || '0'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
            {['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'].map(btn => (
              <Button key={btn} onClick={() => handleCalcBtn(btn)} style={{ padding: '15px 0', backgroundColor: btn === 'C' ? '#f44336' : (btn === '=' ? '#4CAF50' : '#666') }}>{btn}</Button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '15px' }}>
            {['通常', 'ケレン', '修理', '完全'].map(t => <Button key={t} onClick={() => addToCart(t)} style={{ backgroundColor: getTypeColor(t) }}>{t}保存</Button>)}
          </div>
          {editingIndex !== null && <Button modifier="quiet" onClick={deleteItem} style={{ color: '#f44336', marginTop: '10px' }}>削除</Button>}
        </div>
      </Dialog>
    </Page>
  );
}

export default App;
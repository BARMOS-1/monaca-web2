import React, { useState, useEffect } from 'react';
import { Page, Toolbar, Card, Button, List, ListItem, Icon, Tabbar, Tab, Dialog, ProgressCircular, ListHeader } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

// --- スタイル定義（レスポンシブ対応） ---
const styles = `
  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding-bottom: 50px;
  }

  /* 資材グリッド：スマホは2列、PCは幅に合わせて増える */
  .material-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 10px;
    padding: 10px;
  }

  @media (min-width: 600px) {
    .material-grid {
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 20px;
      padding: 20px;
    }
  }

  /* カードのデザイン */
  .item-card {
    margin: 0 !important;
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
    text-align: center;
  }

  @media (hover: hover) {
    .item-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 8px 16px rgba(0,0,0,0.2) !important;
    }
  }

  /* 計算機ダイアログのPC最適化 */
  .ons-dialog {
    max-width: 400px !important;
    width: 90% !important;
    border-radius: 12px !important;
    overflow: hidden;
  }

  /* 送信ボタンのPC最適化 */
  .send-button-container {
    max-width: 600px;
    margin: 0 auto;
    padding: 20px;
  }
`;

const MATERIALS = [
  { id: 1, name: '支柱', img: 'https://placehold.jp/24/333333/ffffff/150x100.png?text=支柱' },
  { id: 2, name: '手すり', img: 'https://placehold.jp/24/666666/ffffff/150x100.png?text=手すり' },
  { id: 3, name: '先行手すり', img: 'https://placehold.jp/24/999999/ffffff/150x100.png?text=先行手すり' },
  { id: 4, name: 'Sウォーク', img: 'https://placehold.jp/24/0044cc/ffffff/150x100.png?text=Sウォーク' },
];

function App() {
  const [cart, setCart] = useState([]); 
  const [history, setHistory] = useState({});
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcDisplay, setCalcDisplay] = useState(''); 
  const [editingIndex, setEditingIndex] = useState(null);

  const GAS_URL = "https://script.google.com/macros/s/AKfycbzQnTADaS5pLCpOq6aX_UceX0octR_F_lUDj3jJeGSDZcmWLC2FSlDVrrFL_9h9emhT/exec";

  const fetchHistory = async () => {
    setLoading(true);
    try {
      // 保存されているパスワードを取得
      const authData = JSON.parse(localStorage.getItem('scaffold_auth'));
      const pass = authData ? authData.token : "";
      // URLの末尾に ?auth=パスワード を追加してGETリクエスト
      const response = await fetch(`${GAS_URL}?auth=${pass}`);
      const data = await response.json();
      const summary = data.reduce((acc, obj) => {
        const dateKey = obj.date.split(' ')[0];
        const itemKey = `${obj.name}-${obj.type}`;
        if (!acc[dateKey]) acc[dateKey] = {};
        if (!acc[dateKey][itemKey]) {
          acc[dateKey][itemKey] = { ...obj };
        } else {
          acc[dateKey][itemKey].count = Number(acc[dateKey][itemKey].count) + Number(obj.count);
        }
        return acc;
      }, {});
      setHistory(summary);
    } catch (e) {
      alert("履歴の取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const sendOrder = async () => {
    if (cart.length === 0 || isSending) return;
    setIsSending(true);
    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ 
          auth: authData?.token, // これを追加
          items: cart 
        })
      });
      alert("全件送信完了しました！");
      setCart([]);
      fetchHistory();
    } catch (e) { 
      alert("送信エラーが発生しました"); 
    } finally {
      setIsSending(false);
    }
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

  const deleteItem = () => {
    if (editingIndex !== null) {
      setCart(cart.filter((_, i) => i !== editingIndex));
      closeDialog();
    }
  };

  const closeDialog = () => {
    setShowDialog(false); setSelectedItem(null); setCalcDisplay(''); setEditingIndex(null);
  };

  const getTypeColor = (type) => {
    const colors = { '通常': '#555', 'ケレン': '#FF9800', '修理': '#f44336', '完全': '#4CAF50' };
    return colors[type] || '#000';
  };

  const renderMenu = () => (
    <Page>
      <div className="page-container">
        <div className="material-grid">
          {MATERIALS.map(item => (
            <Card key={item.id} className="item-card" onClick={() => { setSelectedItem(item); setShowDialog(true); }}>
              <img src={item.img} style={{ width: '100%', borderRadius: '8px', aspectRatio: '3/2', objectFit: 'cover' }} />
              <div style={{ fontWeight: 'bold', fontSize: '1rem', padding: '10px' }}>{item.name}</div>
            </Card>
          ))}
        </div>
      </div>
    </Page>
  );

  const renderCart = () => (
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
            {isSending ? <ProgressCircular indeterminate /> : `スプレッドシートへ送信 (${cart.length})`}
          </Button>
        </div>
      </div>
    </Page>
  );

  const renderHistory = () => (
    <Page>
      <div className="page-container" style={{ maxWidth: '800px' }}>
        <div style={{ textAlign: 'center', padding: '15px' }}>
          <Button onClick={fetchHistory} modifier="outline" disabled={loading}><Icon icon="md-refresh" /> 最新データに更新</Button>
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: '50px' }}><ProgressCircular indeterminate /></div>
        ) : (
          Object.keys(history).map(date => (
            <div key={date}>
              <ListHeader style={{backgroundColor: '#00629d', color: 'white', fontWeight: 'bold'}}>{date} の集計</ListHeader>
              <List>
                {Object.values(history[date]).map((h, i) => (
                  <ListItem key={i}>
                    <div className="center">
                      <span style={{ fontWeight: 'bold' }}>{h.name}</span>
                      <span style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: getTypeColor(h.type), color: 'white' }}>{h.type}</span>
                    </div>
                    <div className="right" style={{ fontWeight: 'bold' }}>{h.count} 個</div>
                  </ListItem>
                ))}
              </List>
            </div>
          ))
        )}
      </div>
    </Page>
  );

  return (
    <Page renderToolbar={() => <Toolbar><div className="center">資材数量管理システム</div></Toolbar>}>
      <style>{styles}</style>
      <Tabbar
        position='bottom'
        renderTabs={() => [
          { content: renderMenu(), tab: <Tab label="選択" icon="md-apps" /> },
          { content: renderCart(), tab: <Tab label="送信待" icon="md-format-list-bulleted" badge={cart.length > 0 ? cart.length : null} /> },
          { content: renderHistory(), tab: <Tab label="履歴" icon="md-time-restore" /> }
        ]}
      />
      <Dialog isOpen={showDialog} onCancel={closeDialog} cancelable>
        <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#fff' }}>
          <h3 style={{marginTop: 0}}>{selectedItem?.name}</h3>
          <div style={{ backgroundColor: '#f0f0f0', padding: '10px', fontSize: '32px', textAlign: 'right', borderRadius: '5px', marginBottom: '10px', border: '1px solid #ccc', fontFamily: 'monospace' }}>{calcDisplay || '0'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '5px' }}>
            {['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'].map(btn => (
              <Button key={btn} onClick={() => handleCalcBtn(btn)} style={{ padding: '15px 0', backgroundColor: btn === 'C' ? '#f44336' : (btn === '=' ? '#4CAF50' : '#666') }}>{btn}</Button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '15px' }}>
            {['通常', 'ケレン', '修理', '完全'].map(t => <Button key={t} onClick={() => addToCart(t)} style={{ backgroundColor: getTypeColor(t), fontSize: '0.9rem' }}>{t}保存</Button>)}
          </div>
          {editingIndex !== null && <Button modifier="quiet" onClick={deleteItem} style={{ color: '#f44336', marginTop: '10px' }}>削除する</Button>}
        </div>
      </Dialog>
    </Page>
  );
}

export default App;
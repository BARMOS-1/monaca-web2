import React, { useState, useEffect } from 'react';
import { Page, Toolbar, Card, Button, List, ListItem, Icon, Tabbar, Tab, Dialog, ProgressCircular, ListHeader } from 'react-onsenui';
import 'onsenui/css/onsenui.css';
import 'onsenui/css/onsen-css-components.css';

const MATERIALS = [
  { id: 1, name: '支柱', img: 'https://placehold.jp/24/333333/ffffff/150x100.png?text=支柱' },
  { id: 2, name: '手すり', img: 'https://placehold.jp/24/666666/ffffff/150x100.png?text=手すり' },
  { id: 3, name: '先行手すり', img: 'https://placehold.jp/24/999999/ffffff/150x100.png?text=先行手すり' },
  { id: 4, name: 'Sウォーク', img: 'https://placehold.jp/24/0044cc/ffffff/150x100.png?text=Sウォーク' },
];

function App() {
  const [cart, setCart] = useState([]); 
  const [history, setHistory] = useState({}); // 日付別にするためオブジェクトに変更
  const [loading, setLoading] = useState(false);
  const [isSending, setIsSending] = useState(false); // 送信中フラグ
  const [showDialog, setShowDialog] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [calcDisplay, setCalcDisplay] = useState(''); 
  const [editingIndex, setEditingIndex] = useState(null);

  const GAS_URL = "https://script.google.com/macros/s/AKfycbwMzDzBvrEvb9SMqAh7NtCqI-iGsRL9cvmpl3drQuqQnIPSkZAnfoM4PR6-SbfIqN3C/exec";

  // 履歴を取得し、日付ごとにグループ化する
 // 履歴を取得し、同じ日付・機材・区分で合算する
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(GAS_URL);
      const data = await response.json();
      
      // 合算処理
      const summary = data.reduce((acc, obj) => {
        const dateKey = obj.date.split(' ')[0]; // "12/23"
        const itemKey = `${obj.name}-${obj.type}`; // "支柱-通常"（これを合算の鍵にする）
        
        if (!acc[dateKey]) acc[dateKey] = {};
        
        if (!acc[dateKey][itemKey]) {
          // 初めて出てきた機材なら新しく作る
          acc[dateKey][itemKey] = { ...obj };
        } else {
          // すでに同じ日付・機材・区分があれば個数をプラスする
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
    
    setIsSending(true); // 送信開始（ボタンを無効化）
    
    try {
      await fetch(GAS_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ items: cart })
      });
      alert("全件送信完了しました！");
      setCart([]);
      fetchHistory(); // 履歴を更新
    } catch (e) { 
      alert("送信エラーが発生しました"); 
    } finally {
      setIsSending(false); // 送信終了（ボタンを復帰）
    }
  };

  // --- (handleCalcBtn, addToCart, deleteItem, closeDialogなどは前回のまま) ---
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', padding: '10px', gap: '10px' }}>
        {MATERIALS.map(item => (
          <Card key={item.id} onClick={() => { setSelectedItem(item); setShowDialog(true); }} style={{ textAlign: 'center', margin: '0' }}>
            <img src={item.img} style={{ width: '100%', borderRadius: '8px' }} />
            <div style={{ fontWeight: 'bold', fontSize: '1.1rem', padding: '8px' }}>{item.name}</div>
          </Card>
        ))}
      </div>
    </Page>
  );

  const renderCart = () => (
    <Page>
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
      </List>
      <div style={{ padding: '20px' }}>
        <Button modifier="large" onClick={sendOrder} disabled={cart.length === 0 || isSending}>
          {isSending ? <><ProgressCircular indeterminate style={{width:'20px',height:'20px',verticalAlign:'middle'}} /> 送信中...</> : `この内容で送信（${cart.length}件）`}
        </Button>
      </div>
    </Page>
  );

 const renderHistory = () => (
    <Page>
      <div style={{ textAlign: 'center', padding: '10px' }}>
        <Button onClick={fetchHistory} modifier="outline" disabled={loading}><Icon icon="md-refresh" /> 集計を更新</Button>
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', marginTop: '50px' }}><ProgressCircular indeterminate /></div>
      ) : (
        Object.keys(history).map(date => (
          <List key={date}>
            <ListHeader style={{backgroundColor: '#e0e0e0', fontWeight: 'bold', color: '#333'}}>
              {date} の集計
            </ListHeader>
            {/* history[date]の中にある各機材情報をループして表示 */}
            {Object.values(history[date]).map((h, i) => (
              <ListItem key={i}>
                <div className="center">
                  <span style={{ fontWeight: 'bold' }}>{h.name}</span>
                  <span style={{ marginLeft: '10px', fontSize: '0.7rem', padding: '2px 8px', borderRadius: '12px', backgroundColor: getTypeColor(h.type), color: 'white' }}>
                    {h.type}
                  </span>
                </div>
                <div className="right" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
                  {h.count} <span style={{fontSize: '0.8rem', marginLeft: '3px'}}>個</span>
                </div>
              </ListItem>
            ))}
          </List>
        ))
      )}
    </Page>
  );

  return (
    <Page renderToolbar={() => <Toolbar><div className="center">資材数量管理</div></Toolbar>}>
      <Tabbar
        position='bottom'
        renderTabs={() => [
          { content: renderMenu(), tab: <Tab label="選択" icon="md-apps" /> },
          { content: renderCart(), tab: <Tab label="送信待" icon="md-format-list-bulleted" badge={cart.length > 0 ? cart.length : null} /> },
          { content: renderHistory(), tab: <Tab label="履歴" icon="md-time-restore" /> }
        ]}
      />
      <Dialog isOpen={showDialog} onCancel={closeDialog} cancelable>
        <div style={{ padding: '15px', textAlign: 'center', backgroundColor: '#eee' }}>
          <h3>{selectedItem?.name}</h3>
          <div style={{ backgroundColor: '#fff', padding: '15px', fontSize: '28px', textAlign: 'right', borderRadius: '5px', marginBottom: '10px', border: '2px solid #ccc' }}>{calcDisplay || '0'}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '5px' }}>
            {['7','8','9','+','4','5','6','-','1','2','3','*','C','0','=','/'].map(btn => (
              <Button key={btn} onClick={() => handleCalcBtn(btn)} style={{ padding: '12px 0', backgroundColor: btn === 'C' ? '#999' : (btn === '=' ? '#2196F3' : '#666') }}>{btn}</Button>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '15px' }}>
            {['通常', 'ケレン', '修理', '完全'].map(t => <Button key={t} onClick={() => addToCart(t)} style={{ backgroundColor: getTypeColor(t) }}>{t}</Button>)}
          </div>
          {editingIndex !== null && <Button modifier="quiet" onClick={deleteItem} style={{ color: '#f44336', marginTop: '10px' }}>削除</Button>}
        </div>
      </Dialog>
    </Page>
  );
}

export default App;
import React from 'react';
import {Route, Routes} from 'react-router-dom';
import {Box, Container, CssBaseline} from '@mui/material';
import Header from './components/Header';
import Navigation from './components/Navigation';
import Dashboard from './routes/dashboard/Dashboard';
import Data from './routes/data/Data';
import Resources from './routes/resources/Resources';
import Settings from './routes/settings/Settings';
import Footer from './components/Footer';

const App: React.FC = () => {
    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            minHeight: '100vh'
        }}>
            <CssBaseline/>
            <Header/>
            <Navigation/>
            <Box component="main" sx={{flexGrow: 1, py: 3}}>
                <Container>
                    <Routes>
                        <Route path="/" element={<Dashboard/>}/>
                        <Route path="/data" element={<Data/>}/>
                        <Route path="/resources" element={<Resources/>}/>
                        <Route path="/settings" element={<Settings/>}/>
                    </Routes>
                </Container>
            </Box>
            <Footer/>
        </Box>
    );
};

export default App;
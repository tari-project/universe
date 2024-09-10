import { viewType } from '../../store/types';
import MiningView from './MiningView/MiningView';
import TribesView from './TribesView/TribesView';
import SetupViewContainer from './SetupView/SetupViewContainer';
import { DashboardContainer } from './styles';
import { Col, Guide, Row } from '@app/theme/styles.ts';

function Dashboard({ status }: { status: viewType }) {
    const viewMarkup =
        status == 'setup' ? <SetupViewContainer /> : status == 'tribes' ? <TribesView /> : <MiningView />;

    return (
        <DashboardContainer layout>
            {viewMarkup}
            {/*temp guide for alignment test*/}
            <Guide layout>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
                <Row layout>
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                    <Col layout />
                </Row>
            </Guide>
        </DashboardContainer>
    );
}

export default Dashboard;

<?php
include("../../connect.php"); 
$response = array();
if(isset($_POST['current_date']) && isset($_POST['distributor_id']))
{
	$dis_id = $_POST['distributor_id'];
	$cdate = $_POST['current_date'];
	$txn_detail=array();
	$select_data=mysqli_query($con,"select *,tbl_receipt_transaction.party_id as partyid from tbl_receipt_transaction,tbl_party where tbl_receipt_transaction.party_id=tbl_party.party_id and tbl_party.distributor_id ='$dis_id' and tbl_receipt_transaction.receipt_date = '$cdate'");
	if(mysqli_num_rows($select_data)>0)
	{     
		while($fetch_data=mysqli_fetch_array($select_data))
		{		
			$txn_detail['receipt_id']=$fetch_data['receipt_id'];
			$txn_detail['receipt_date']=$fetch_data['receipt_date'];
			$txn_detail['receipt_time']=$fetch_data['receipt_time'];
			$txn_detail['txn_receipt_id']=$fetch_data['txn_receipt_id'];
			$txn_detail['total_amount']=$fetch_data['total_amount'];
			$txn_detail['receipt_disc_amt']=$fetch_data['receipt_disc_amt'];
			$txn_detail['payment_mode']=$fetch_data['payment_mode'];	
			$txn_detail['payment_type']=$fetch_data['payment_type'];
			$txn_detail['cash_amount']=$fetch_data['cash_amount'];
			$txn_detail['cheque_amount']=$fetch_data['cheque_amount'];
			$txn_detail['party_name']=$fetch_data['party_name'];
			$txn_detail['party_phone']=$fetch_data['party_phone'];
			$txn_detail['partyid']=$fetch_data['partyid'];
			$response['txn_detail'][]=$txn_detail;
		}
	}
	else
	{
		$response['txn_detail']=$txn_detail;
	}
	
	$purchase_txn_detail=array();
	$select_pur_data=mysqli_query($con,"select * from tbl_purchase_payment_transaction,tbl_purchase_party where tbl_purchase_payment_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_party.distributor_id ='$dis_id' and tbl_purchase_payment_transaction.payment_date = '$cdate'");
	if(mysqli_num_rows($select_pur_data)>0)
	{     
		while($fetch_data=mysqli_fetch_array($select_pur_data))
		{		
			$purchase_txn_detail['payment_id']=$fetch_data['payment_id'];
			$purchase_txn_detail['payment_date']=$fetch_data['payment_date'];
			$purchase_txn_detail['payment_time']=$fetch_data['payment_time'];
			$purchase_txn_detail['txn_receipt_id']=$fetch_data['bill_no'];
			$purchase_txn_detail['total_amount']=$fetch_data['total_amount'];
			$purchase_txn_detail['payment_mode']=$fetch_data['payment_mode'];	
			$purchase_txn_detail['payment_type']=$fetch_data['payment_type'];
			$purchase_txn_detail['party_name']=$fetch_data['party_name'];
			$purchase_txn_detail['party_phone']=$fetch_data['party_phone'];
			$purchase_txn_detail['purchase_party_id']=$fetch_data['purchase_party_id'];
			$response['purchase_txn_detail'][]=$purchase_txn_detail;
		}
	}
	else
	{
		$response['purchase_txn_detail']=$purchase_txn_detail;
	}
	
	
	
	
	$response['success']='1';
	$response['message']="Fetch Detail Successful";
}
else
{
	$response['success']='0';
	$response['details']="Required Field Missing!!";
}	
echo json_encode($response);
?>
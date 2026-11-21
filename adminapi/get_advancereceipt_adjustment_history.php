<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['receipt_txnid']) && isset($_POST['bill_no']) )
{
	$session_dist_ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$session_dist_ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$cdate22 = date("Y-m-d");
	
	$uid = $_POST['receipt_txnid'];
	$bid = $_POST['bill_no'];
	
	$advance_detail=array();
	$query = mysqli_query($con,"select * from tbl_receipt_transaction where txn_receipt_id='$bid' and remark='$uid' and payment_mode='Adjust Advance Payment'");
	if(mysqli_num_rows($query)>0)
	{
		while($row = mysqli_fetch_array($query)) 
		{
			$row_txn=$row['transaction_id'];
			$row_party=$row['party_id'];
			$pay_receipt_id=$row['receipt_id'];
			if($row_party>0) 
			{
				$res = mysqli_query($con,"SELECT party_name,party_phone,tb_insertdatetime FROM tbl_party WHERE party_id='$row_party' and distributor_id='$session_dist_ver'");
				while($fetch_data = mysqli_fetch_array($res)) 
				{
					$advance_detail['receipt_id']=$pay_receipt_id;
					$advance_detail['bill_no']='Business Opening Outstanding';
					$advance_detail['bill_date']=$fetch_data['tb_insertdatetime'];
					$advance_detail['party_name']=$fetch_data['party_name'];
					$advance_detail['party_phone']=$fetch_data['party_phone'];
					$advance_detail['total_amount']=$row['total_amount'];
					$advance_detail['receipt_date']=$row['receipt_date'];
					$response['advance_detail'][]=$advance_detail;
				}
			}
			else
			{
				$res = mysqli_query($con,"SELECT tbl_party_transaction.transaction_bill_number,tbl_party.party_name,tbl_party.party_phone, tbl_party_transaction.transaction_date FROM tbl_party_transaction,tbl_party WHERE tbl_party_transaction.transaction_to = tbl_party.party_id AND tbl_party_transaction.transaction_id='$row_txn'");	
				while($fetch_data = mysqli_fetch_array($res)) 
				{
					$advance_detail['receipt_id']=$pay_receipt_id;
					$advance_detail['bill_no']=$fetch_data['transaction_bill_number'];
					$advance_detail['bill_date']=$fetch_data['transaction_date'];
					$advance_detail['party_name']=$fetch_data['party_name'];
					$advance_detail['party_phone']=$fetch_data['party_phone'];
					$advance_detail['total_amount']=$row['total_amount'];
					$advance_detail['receipt_date']=$row['receipt_date'];
					$response['advance_detail'][]=$advance_detail;
				}
			}
		}
	}
	else
	{
		$response['advance_detail']=$advance_detail;
	}
	$response['success']='1';
	$response['details']="Fetch Detail Successful";
}		
else
{
	$response['success']='0';
	$response['details']="Required field missing";
}	
echo json_encode($response);
?>
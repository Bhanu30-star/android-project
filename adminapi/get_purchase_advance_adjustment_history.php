<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['party_id']) && isset($_POST['receipt_txnid']))
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
	$uid = $_POST['receipt_txnid'];
	$pid = $_POST['party_id'];
	
	$advance_detail=array();
	$query = mysqli_query($con,"select * from tbl_purchase_payment_transaction where adjust_by_receipt_bill_no='$uid' and payment_mode='Adjustment' and remark='Advance Amt' and distributor_id='$session_dist_ver'");
	while($row = mysqli_fetch_array($query)) 
	{
		$row_txn=$row['unique_bill'];
		$row_bill=$row['bill_no'];
		$row_party=$row['party_id'];
		$row_payment_id=$row['payment_id'];
		if($row_party>0) 
		{
			$res = mysqli_query($con,"SELECT party_name,party_phone,insert_datetime FROM tbl_purchase_party WHERE purchase_party_id='$row_party' and distributor_id='$session_dist_ver'");
			while($fetch_data = mysqli_fetch_array($res)) 
			{
				$advance_detail['payment_id']=$row_payment_id;
				$advance_detail['bill_no']='Business Opening Outstanding';
				$advance_detail['bill_date']=date("Y-m-d", strtotime($fetch_data['insert_datetime']));
				$advance_detail['party_name']=$fetch_data['party_name'];
				$advance_detail['party_phone']=$fetch_data['party_phone'];
				$advance_detail['total_amount']=$row['total_amount'];
				$advance_detail['payment_date']=$row['payment_date'];
				$response['advance_detail'][]=$advance_detail;
			}
		}
		else
		{		
			$res = mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_purchase_party WHERE tbl_distributor_transaction.party_id = tbl_purchase_party.purchase_party_id AND tbl_distributor_transaction.unique_bill='$row_txn' and tbl_distributor_transaction.bill_no='$row_bill' group by bill_no,unique_bill");	
			while($fetch_data = mysqli_fetch_array($res))
			{
				$advance_detail['payment_id']=$row_payment_id;
				$advance_detail['bill_no']=$row_bill;
				$advance_detail['bill_date']=$fetch_data['transaction_date'];
				$advance_detail['party_name']=$fetch_data['party_name'];
				$advance_detail['party_phone']=$fetch_data['party_phone'];
				$advance_detail['total_amount']=$row['total_amount'];
				$advance_detail['payment_date']=$row['payment_date'];
				$response['advance_detail'][]=$advance_detail;
			}
		}
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
<?php
include("../../connect.php");
$response = array();
if(isset($_POST['distributor_id']) && isset($_POST['party_id']) && isset($_POST['unique_bill']) && isset($_POST['bill_no']) )
{
	$ver = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$ver'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$cdate11  = date("Y-m-d");
	$cdate22 = date("Y-m-d");
	$uid = $_POST['unique_bill'];
	$bid = $_POST['bill_no'];
	$pid = $_POST['party_id'];
	$debitnote_detail=array();
	$query = mysqli_query($con,"select * from tbl_purchase_payment_transaction where adjust_by_receipt_bill_no='$bid' and adjust_by_unique_bill='$uid' and payment_mode='Adjustment' and distributor_id='$ver'");
	if(mysqli_num_rows($query)>0)
	{
		while($row = mysqli_fetch_array($query)) 
		{
			$row_unique_bill=$row['unique_bill'];
			$row_billno=$row['bill_no'];
			$row_party=$row['party_id'];
			$row_payment_id=$row['payment_id'];
			if($row_party>0) 
			{
				$res = mysqli_query($con,"SELECT party_name,party_phone,insert_datetime FROM tbl_purchase_party WHERE purchase_party_id='$row_party' and distributor_id='$ver'");
				while($fetch_data = mysqli_fetch_array($res)) 
				{
					$debitnote_detail['payment_id']=$row_payment_id;
					$debitnote_detail['bill_no']='Business Opening Outstanding';
					$debitnote_detail['bill_date']=$fetch_data['insert_datetime'];
					$debitnote_detail['party_name']=$fetch_data['party_name'];
					$debitnote_detail['party_phone']=$fetch_data['party_phone'];
					$debitnote_detail['total_amount']=$row['total_amount'];
					$debitnote_detail['receipt_date']=$row['payment_date'];
					$response['debitnote_detail'][]=$debitnote_detail;
				}
			}
			else
			{
				$res = mysqli_query($con,"SELECT tbl_purchase_party.party_name,tbl_distributor_transaction.bill_date, tbl_purchase_party.party_phone FROM tbl_distributor_transaction,tbl_purchase_party where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_purchase_party.distributor_id='$ver' and  tbl_distributor_transaction.unique_bill='$row_unique_bill' and tbl_distributor_transaction.bill_no='$row_billno' group by tbl_distributor_transaction.unique_bill,bill_no");	
				while($fetch_data = mysqli_fetch_array($res)) 
				{
					$debitnote_detail['payment_id']=$row_payment_id;
					$debitnote_detail['bill_no']=$row_billno;
					$debitnote_detail['bill_date']=$fetch_data['bill_date'];
					$debitnote_detail['party_name']=$fetch_data['party_name'];
					$debitnote_detail['party_phone']=$fetch_data['party_phone'];
					$debitnote_detail['total_amount']=$row['total_amount'];
					$debitnote_detail['receipt_date']=$row['payment_date'];
					$response['debitnote_detail'][]=$debitnote_detail;
				}
			}
		}
	}
	else
	{
		$response['debitnote_detail']=$debitnote_detail;
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
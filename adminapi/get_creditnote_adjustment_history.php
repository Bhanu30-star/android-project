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
	$creditnote_detail=array();
	$query = mysqli_query($con,"select * from tbl_receipt_transaction where txn_receipt_id='$bid' and remark='$uid' and payment_mode='Adjust Credit Note'");
	if(mysqli_num_rows($query)>0)
	{
		while($row = mysqli_fetch_array($query)) 
		{
			$row_txn=$row['transaction_id'];
			$row_party=$row['party_id'];
			$pay_receipt_id=$row['receipt_id'];
			if($row_party>0) 
			{
				$res = mysqli_query($con,"SELECT party_name,party_phone,tb_insertdatetime FROM tbl_party WHERE party_id='$row_party' and distributor_id='$ver'");
				while($fetch_data = mysqli_fetch_array($res)) 
				{
					$creditnote_detail['receipt_id']=$pay_receipt_id;
					$creditnote_detail['bill_no']='Business Opening Outstanding';
					$creditnote_detail['bill_date']=date("Y-m-d", strtotime($fetch_data['tb_insertdatetime']));
					$creditnote_detail['party_name']=$fetch_data['party_name'];
					$creditnote_detail['party_phone']=$fetch_data['party_phone'];
					$creditnote_detail['total_amount']=$row['total_amount'];
					$creditnote_detail['receipt_date']=$row['receipt_date'];
					$response['creditnote_detail'][]=$creditnote_detail;
				}
			}
			else
			{		
				$res = mysqli_query($con,"SELECT tbl_party_transaction.transaction_bill_number,tbl_party.party_name,tbl_party.party_phone, tbl_party_transaction.transaction_date FROM tbl_party_transaction,tbl_party WHERE tbl_party_transaction.transaction_to=tbl_party.party_id AND tbl_party_transaction.transaction_id='$row_txn'");
				while($fetch_data = mysqli_fetch_array($res)) 
				{
					$creditnote_detail['receipt_id']=$pay_receipt_id;
					$creditnote_detail['bill_no']=$fetch_data['transaction_bill_number'];
					$creditnote_detail['bill_date']=$fetch_data['transaction_date'];
					$creditnote_detail['party_name']=$fetch_data['party_name'];
					$creditnote_detail['party_phone']=$fetch_data['party_phone'];
					$creditnote_detail['total_amount']=$row['total_amount'];
					$creditnote_detail['receipt_date']=$row['receipt_date'];
					$response['creditnote_detail'][]=$creditnote_detail;
				}
			}
		}
	}
	else
	{
		$response['creditnote_detail']=$creditnote_detail;
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
<?php
$response = array();
include("../../connect.php");
if(isset($_POST['distributor_id']) && isset($_POST['start_date']) && isset($_POST['end_date']))
{  
	$dis_id = $_POST['distributor_id'];
	date_default_timezone_set('Asia/Calcutta');
	$disSql = mysqli_query($con,"SELECT country FROM tbl_distributor WHERE distributor_id='$dis_id'");
	if(mysqli_num_rows($disSql)>0)
	{
		$disRow = mysqli_fetch_array($disSql);
		if($disRow['country']=='United Arab Emirates')
			date_default_timezone_set('Asia/Dubai');
	}
	$startdate=$_POST['start_date'];
	$start_date=date('Y-m-01',(strtotime ( '-2 month' , strtotime ( $startdate) ) ));
	$end_date= date("Y-m-t");
	
	$details=array();
	$current_month  = date("m");
	
	if($current_month-2>0)
	{
		$f_year1 = date('Y');
		for($i=$current_month-2;$i<=$current_month;$i++)
		{
			$details['year'] =  $f_year1;
			$details['month'] = $i;
			$details['month_name'] =  date("F", mktime(0, 0, 0, $i, 10));
			$seq_start_date=date('Y-m-d',(strtotime ($f_year1.'-'.$i.'-01')));
			$seq_end_date=date('Y-m-t',(strtotime ($seq_start_date)));
			$details['detail_data']=array();
			
			$select_process_seq=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Auto Refill' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='Auto Refill';
				}
			}
			else
			{
				$select_month_seq=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Auto Refill' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='Auto Refill';
			}
			$details['detail_data'][]=$detail_data;
			
			$select_process_seq_1=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Digital Transfer' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq_1)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq_1))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='Digital Transfer';
				}
			}
			else
			{
				$select_month_seq_1=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Digital Transfer' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq_1);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='Digital Transfer';
			}
			$details['detail_data'][]=$detail_data;
			
			$select_process_seq_2=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='E-Recharge' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq_2)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq_2))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='E-Recharge';
				}
			}
			else
			{
				$select_month_seq_2=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='E-Recharge' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq_2);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='E-Recharge';
			}
			$details['detail_data'][]=$detail_data;
			$response['detail_value'][]=$details;
		}
	}
	else
	{
		if((int)$current_month==1)
		{
			$f_year1 = date('Y')-1;
			for($i=11;$i<=12;$i++)
			{
				$details['year'] =  $f_year1;
				$details['month'] = $i;
				$details['month_name'] =  date("F", mktime(0, 0, 0, $i, 10));
				$seq_start_date=date('Y-m-d',(strtotime ($f_year1.'-'.$i.'-01')));
				$seq_end_date=date('Y-m-t',(strtotime ($seq_start_date)));
				$details['detail_data']=array();
				$select_process_seq=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Auto Refill' ORDER BY txn_bill_no desc limit 1");
				if(mysqli_num_rows($select_process_seq)>0)
				{
					while($fetch_data_seq=mysqli_fetch_array($select_process_seq))
					{
						$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
						$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
						$detail_data['final_seq_type']='Auto Refill';
					}
				}
				else
				{
					$select_month_seq=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Auto Refill' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
					$fetch_final_seq=mysqli_fetch_array($select_month_seq);
					$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
					$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
					$detail_data['final_seq_type']='Auto Refill';
				}
				$details['detail_data'][]=$detail_data;
				
				$select_process_seq_1=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Digital Transfer' ORDER BY txn_bill_no desc limit 1");
				if(mysqli_num_rows($select_process_seq_1)>0)
				{
					while($fetch_data_seq=mysqli_fetch_array($select_process_seq_1))
					{
						$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
						$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
						$detail_data['final_seq_type']='Digital Transfer';
					}
				}
				else
				{
					$select_month_seq_1=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Digital Transfer' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
					$fetch_final_seq=mysqli_fetch_array($select_month_seq_1);
					$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
					$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
					$detail_data['final_seq_type']='Digital Transfer';
				}
				$details['detail_data'][]=$detail_data;
				
				$select_process_seq_2=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='E-Recharge' ORDER BY txn_bill_no desc limit 1");
				if(mysqli_num_rows($select_process_seq_2)>0)
				{
					while($fetch_data_seq=mysqli_fetch_array($select_process_seq_2))
					{
						$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
						$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
						$detail_data['final_seq_type']='E-Recharge';
					}
				}
				else
				{
					$select_month_seq_2=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='E-Recharge' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
					$fetch_final_seq=mysqli_fetch_array($select_month_seq_2);
					$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
					$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
					$detail_data['final_seq_type']='E-Recharge';
				}
				$details['detail_data'][]=$detail_data;
				$response['detail_value'][]=$details;
			}
			$f_year1=date('Y');
			$details['year'] =  $f_year1;
			$details['month'] = $current_month;
			$details['month_name'] =  date("F", mktime(0, 0, 0, $current_month, 10));
			$seq_start_date=date('Y-m-d',(strtotime ($f_year1.'-'.$current_month.'-01')));
			$seq_end_date=date('Y-m-t',(strtotime ($seq_start_date)));
			$details['detail_data']=array();
			$select_process_seq=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Auto Refill' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='Auto Refill';
				}
			}
			else
			{
				$select_month_seq=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Auto Refill' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='Auto Refill';
			}
			$details['detail_data'][]=$detail_data;
				
			$select_process_seq_1=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Digital Transfer' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq_1)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq_1))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='Digital Transfer';
				}
			}
			else
			{
				$select_month_seq_1=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Digital Transfer' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq_1);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='Digital Transfer';
			}
			$details['detail_data'][]=$detail_data;
				
			$select_process_seq_2=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='E-Recharge' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq_2)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq_2))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='E-Recharge';
				}
			}
			else
			{
				$select_month_seq_2=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='E-Recharge' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq_2);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='E-Recharge';
			}
			$details['detail_data'][]=$detail_data;
			$response['detail_value'][]=$details;
		}
		else if((int)$current_month==2)
		{
			$f_year1=date('Y')-1;
			$details['year'] =  $f_year1;
			$details['month'] = 12;
			$details['month_name'] =  date("F", mktime(0, 0, 0, 12, 10));
			$seq_start_date=date('Y-m-d',(strtotime ($f_year1.'-12-01')));
			$seq_end_date=date('Y-m-t',(strtotime ($seq_start_date)));
			$details['detail_data']=array();
			$select_process_seq=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Auto Refill' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='Auto Refill';
				}
			}
			else
			{
				$select_month_seq=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Auto Refill' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='Auto Refill';
			}
			$details['detail_data'][]=$detail_data;
				
			$select_process_seq_1=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Digital Transfer' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq_1)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq_1))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='Digital Transfer';
				}
			}
			else
			{
				$select_month_seq_1=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Digital Transfer' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq_1);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='Digital Transfer';
			}
			$details['detail_data'][]=$detail_data;
				
			$select_process_seq_2=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='E-Recharge' ORDER BY txn_bill_no desc limit 1");
			if(mysqli_num_rows($select_process_seq_2)>0)
			{
				while($fetch_data_seq=mysqli_fetch_array($select_process_seq_2))
				{
					$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
					$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
					$detail_data['final_seq_type']='E-Recharge';
				}
			}
			else
			{
				$select_month_seq_2=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='E-Recharge' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
				$fetch_final_seq=mysqli_fetch_array($select_month_seq_2);
				$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
				$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
				$detail_data['final_seq_type']='E-Recharge';
			}
			$details['detail_data'][]=$detail_data;
			$response['detail_value'][]=$details;
			
			$f_year1 = date('Y');
			for($i=1;$i<=2;$i++)
			{
				$details['year'] =  $f_year1;
				$details['month'] = $i;
				$details['month_name'] =  date("F", mktime(0, 0, 0, $i, 10));
				$seq_start_date=date('Y-m-d',(strtotime ($f_year1.'-'.$i.'-01')));
				$seq_end_date=date('Y-m-t',(strtotime ($seq_start_date)));
				$details['detail_data']=array();
				$select_process_seq=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Auto Refill' ORDER BY txn_bill_no desc limit 1");
				if(mysqli_num_rows($select_process_seq)>0)
				{
					while($fetch_data_seq=mysqli_fetch_array($select_process_seq))
					{
						$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
						$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
						$detail_data['final_seq_type']='Auto Refill';
					}
				}
				else
				{
					$select_month_seq=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Auto Refill' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
					$fetch_final_seq=mysqli_fetch_array($select_month_seq);
					$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
					$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
					$detail_data['final_seq_type']='Auto Refill';
				}
				$details['detail_data'][]=$detail_data;
				
				$select_process_seq_1=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='Digital Transfer' ORDER BY txn_bill_no desc limit 1");
				if(mysqli_num_rows($select_process_seq_1)>0)
				{
					while($fetch_data_seq=mysqli_fetch_array($select_process_seq_1))
					{
						$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
						$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
						$detail_data['final_seq_type']='Digital Transfer';
					}
				}
				else
				{
					$select_month_seq_1=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='Digital Transfer' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
					$fetch_final_seq=mysqli_fetch_array($select_month_seq_1);
					$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
					$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
					$detail_data['final_seq_type']='Digital Transfer';
				}
				$details['detail_data'][]=$detail_data;
				
				$select_process_seq_2=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$seq_start_date' and message_date<='$seq_end_date' and message_type='E-Recharge' ORDER BY txn_bill_no desc limit 1");
				if(mysqli_num_rows($select_process_seq_2)>0)
				{
					while($fetch_data_seq=mysqli_fetch_array($select_process_seq_2))
					{
						$detail_data['final_seq_bill']=$fetch_data_seq['txn_bill_no'];
						$detail_data['final_seq_date']=$fetch_data_seq['message_date'];
						$detail_data['final_seq_type']='E-Recharge';
					}
				}
				else
				{
					$select_month_seq_2=mysqli_query($con,"SELECT max(transaction_bill_number) as final_seq,max(transaction_date) as txndate FROM `tbl_party_transaction` where bill_mode_operator='E-Recharge' and transaction_date>='$seq_start_date' and transaction_date<='$seq_end_date' and bill_type in ('Tax Invoice','Payout') and transaction_from in (select user_id from tbl_user where `distributor_id` = '$dis_id')");
					$fetch_final_seq=mysqli_fetch_array($select_month_seq_2);
					$detail_data['final_seq_bill']=$fetch_final_seq['final_seq'];
					$detail_data['final_seq_date']=$fetch_final_seq['txndate'];
					$detail_data['final_seq_type']='E-Recharge';
				}
				$details['detail_data'][]=$detail_data;
				$response['detail_value'][]=$details;
			}
		}
			
	}
	
	
	$select_process_recseq=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and operator_detail='Airtel Money' ORDER BY txn_bill_no desc limit 1");
	if(mysqli_num_rows($select_process_recseq)>0)
	{
		while($fetch_data_recseq=mysqli_fetch_array($select_process_recseq))
		{
			$response['final_seq_receipt']=$fetch_data_recseq['txn_bill_no'];
		}
	}
	else
	{
		$select_month_recseq=mysqli_query($con,"SELECT * FROM `tbl_sequence` where `distributor_id` = '$dis_id'");
		$fetch_final_recseq=mysqli_fetch_array($select_month_recseq);
		$response['final_seq_receipt']=$fetch_final_recseq['receipt_sequence'];
	}
	
	
	$parties=array();
	$select_product=mysqli_query($con,"SELECT * FROM tbl_purchase_party where distributor_id='$dis_id'");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$parties['party_id']=$fetch_product['purchase_party_id'];
			$parties['party_name']=$fetch_product['party_name'];
			$parties['party_phone']=$fetch_product['party_phone'];
			$parties['gstin_no']=$fetch_product['gstin_no'];
			$parties['status']=$fetch_product['status'];
			$parties['place_of_supply']=$fetch_product['place_of_supply'];
			$parties['adjustment_amount']=$actual_amt;
			$response['parties'][]=$parties;
		} 
	}		
	else
	{
		$response['parties']=$parties;
	}	
	
	$message_purchase=array();
	$select_purcahse1=mysqli_query($con,"SELECT *,tbl_client_auto_sync_message_detail.status as billstatus FROM tbl_client_auto_sync_message_detail,tbl_purchase_party where tbl_client_auto_sync_message_detail.purchase_party_id = tbl_purchase_party.purchase_party_id and tbl_client_auto_sync_message_detail.distributor_id='$dis_id' and type_detail='Purchase' and message_date>='$start_date' and message_date<='$end_date'");
	if(mysqli_num_rows($select_purcahse1)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_purcahse1))
		{
			$message_purchase['message_id']=$fetch_product['message_id'];
			$message_purchase['message_txn_id']=$fetch_product['message_txn_id'];
			$message_purchase['message_date']=$fetch_product['message_date'];
			$message_purchase['status']=$fetch_product['billstatus'];
			$message_purchase['quantity']=$fetch_product['quantity'];
			$message_purchase['party_phone']=$fetch_product['party_phone'];
			$message_purchase['insert_at']=$fetch_product['insert_at'];
			$response['message_purchase'][]=$message_purchase;
		}
	}
	else
	{
		$response['message_purchase']=$message_purchase;
	}
	
	$select_purcahse2=mysqli_query($con,"SELECT * FROM tbl_distributor_transaction,tbl_purchase_party where tbl_distributor_transaction.party_id=tbl_purchase_party.purchase_party_id and tbl_distributor_transaction.distributor_id='$dis_id' and tbl_distributor_transaction.txn_type='Add' and bill_date>='$start_date' and bill_date<='$end_date' group by bill_no");
	if(mysqli_num_rows($select_purcahse2)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_purcahse2))
		{
			$message_purchase['message_id']=$fetch_product['transaction_id'];
			$message_purchase['message_txn_id']=$fetch_product['message_txn_id'];
			$message_purchase['message_date']=$fetch_product['bill_date'];
			$message_purchase['status']='Complete';
			$message_purchase['quantity']=$fetch_product['quantity'];
			$message_purchase['party_phone']=$fetch_product['party_phone'];
			$message_purchase['insert_at']=$fetch_product['transaction_date'].' '.$fetch_product['transaction_time'];
			$response['message_purchase'][]=$message_purchase;
		}
	}
	
	$message_sale=array();
	$select_sale1=mysqli_query($con,"SELECT * FROM tbl_autofill_retailer_message_detail where distributor_id='$dis_id' and message_date>='$start_date' and message_date<='$end_date' order by message_id ASC");
	if(mysqli_num_rows($select_sale1)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_sale1))
		{
			$message_sale['message_id']=$fetch_product['message_id'];
			$message_sale['transaction_id']=$fetch_product['transaction_id'];
			$message_sale['message_date']=$fetch_product['message_date'];
			$message_sale['status']=$fetch_product['status'];
			$message_sale['quantity']=$fetch_product['quantity'];
			$message_sale['amount']=$fetch_product['amount'];
			$message_sale['retailer_phone']=$fetch_product['party_phone'];
			$message_sale['insert_at']=$fetch_product['insert_date'].' '.$fetch_product['insert_time'];
			$response['message_sale'][]=$message_sale;
		}
	}
	else
	{
		$response['message_sale']=$message_sale;
	}
	
	
	$select_sale2=mysqli_query($con,"SELECT * FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Sale' and message_date>='$start_date' and message_date<='$end_date'");
	if(mysqli_num_rows($select_sale2)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_sale2))
		{
			$message_sale['message_id']=$fetch_product['message_id'];
			$message_sale['transaction_id']=$fetch_product['message_txn_id'];
			$message_sale['message_date']=$fetch_product['message_date'];
			$message_sale['status']=$fetch_product['status'];
			$message_sale['quantity']=$fetch_product['quantity'];
			$message_sale['amount']=$fetch_product['amount'];
			$message_sale['retailer_phone']=$fetch_product['retailer_phone'];
			$message_sale['insert_at']=$fetch_product['insert_at'];
			$response['message_sale'][]=$message_sale;
		}
	}
	
	$select_sale3=mysqli_query($con,"SELECT * FROM tbl_party_transaction,tbl_party_transaction_detail,tbl_party where tbl_party_transaction.transaction_id=tbl_party_transaction_detail.transaction_id and tbl_party_transaction.transaction_to = tbl_party.party_id and tbl_party.distributor_id='$dis_id' and transaction_date>='$start_date' and transaction_date<='$end_date' and message_txn_id !=''");
	if(mysqli_num_rows($select_sale3)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_sale3))
		{
			$message_sale['message_id']=$fetch_product['transaction_id'];
			$message_sale['transaction_id']=$fetch_product['message_txn_id'];
			$message_sale['message_date']=$fetch_product['transaction_date'];
			$message_sale['status']='Complete';
			$message_sale['quantity']=$fetch_product['quantity'];
			$message_sale['amount']=$fetch_product['final_amt'];
			$message_sale['retailer_phone']=$fetch_product['party_phone'];
			$message_sale['insert_at']=$fetch_product['transaction_date'].' '.$fetch_product['transaction_time'];
			$response['message_sale'][]=$message_sale;
		}
	}
	
	$e_purchase_date=$autorefill_date=$digital_transfer_date='0000-00-00';
	$select_purcahse_data=mysqli_query($con,"SELECT insert_at FROM tbl_client_auto_sync_message_detail where distributor_id='$dis_id' and type_detail='Purchase' order by message_date desc limit 1");
	if(mysqli_num_rows($select_purcahse_data)>0)
	{     
		while($fetch_product=mysqli_fetch_assoc($select_purcahse_data))
		{
			$e_purchase_date=$fetch_product['insert_at'];
		}
	}
	$response['e_purchase_synch_date_time']=$e_purchase_date;
	$executive_detail=array();
	$select_user=mysqli_query($con,"select user_id,user_name,user_phone from tbl_user where distributor_id='$dis_id' and status in ('Active','Deactive')");
	if(mysqli_num_rows($select_user)>0)
	{     
		while($fetch_user=mysqli_fetch_array($select_user))
		{
			$executive_detail['user_id']=$fetch_user['user_id'];
			$executive_detail['user_name']=$fetch_user['user_name'];
			$executive_detail['user_phone']=$fetch_user['user_phone'];
			$response['executive_detail'][]=$executive_detail;
		}
	}
	else
	{
		$response['executive_detail']=$executive_detail;
	}
	
	$select_product=mysqli_query($con,"SELECT * FROM tbl_product where distributor_id='$dis_id' and product_category='VODA LAPU'");
	if(mysqli_num_rows($select_product)>0)
	{     
		while($fetch_product=mysqli_fetch_array($select_product))
		{
			$response['product_id']=$fetch_product['product_id'];
			$response['product_name']=$fetch_product['product_name'];
			$response['product_price']=$fetch_product['product_price'];
		} 
	}
	
	$response['success']=1;
	$response['details']="Data Fetch Successfully";
}
else
{
	$response['success']=0;
	$response['details']="Required Field Missing...!!";
}		
echo json_encode($response);
?> 